import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * Select questions from Firestore questionBank for a given company test.
 * @param {string} companyKey - e.g. 'tcs', 'infosys'
 * @param {string} section - e.g. 'quant', 'lr', 'verbal', 'di', 'ga'
 * @param {number} count - how many questions to return
 * @param {string[]} seenIds - question IDs the user has already seen
 * @returns {Promise<Array>} array of question objects
 */
export async function selectQuestions(companyKey, section, count, seenIds = []) {
  try {
    // Query questions matching section and company
    const q = query(
      collection(db, 'questionBank'),
      where('section', '==', section),
      where('companies', 'array-contains', companyKey),
      limit(count * 3) // fetch extra to allow filtering
    );

    const snap = await getDocs(q);
    let questions = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(q => !seenIds.includes(q.id));

    // Shuffle
    questions = questions.sort(() => Math.random() - 0.5);

    // If not enough, try without company filter
    if (questions.length < count) {
      const fallbackQ = query(
        collection(db, 'questionBank'),
        where('section', '==', section),
        limit(count * 3)
      );
      const fallbackSnap = await getDocs(fallbackQ);
      const fallbackQuestions = fallbackSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(q => !seenIds.includes(q.id))
        .filter(q => !questions.find(existing => existing.id === q.id));
      
      questions = [...questions, ...fallbackQuestions].sort(() => Math.random() - 0.5);
    }

    // If STILL not enough, generate via API
    if (questions.length < count) {
      try {
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section,
            company: companyKey,
            difficulty: 2,
            exclude: questions.map(q => q.question).slice(0, 5)
          })
        });
        if (res.ok) {
          const generated = await res.json();
          if (generated.questions && generated.questions.length > 0) {
            const { addDoc, collection: fsCollection } = await import('firebase/firestore');
            const savedQs = [];
            for (const q of generated.questions) {
              try {
                const docRef = await addDoc(fsCollection(db, 'questionBank'), q);
                savedQs.push({ id: docRef.id, ...q });
              } catch (writeErr) {
                console.error('Failed to write generated question to Firestore:', writeErr);
                // Still use the question in the session even if Firestore write fails
                savedQs.push({ id: `temp-${Math.random()}`, ...q });
              }
            }
            questions = [...questions, ...savedQs];
          }
        }
      } catch (e) {
        console.error('Failed to generate questions:', e);
      }
    }

    // If STILL no questions (empty DB), use local fallback questions
    if (questions.length === 0) {
      try {
        const { loadAllStaticQuestions } = await import('@/lib/questionsData');
        const allStatic = loadAllStaticQuestions();
        questions = allStatic
          .filter(q => q.section === section && q.companies.includes(companyKey))
          .filter(q => !seenIds.includes(q.id));

        if (questions.length < count) {
          const extraQs = allStatic
            .filter(q => q.section === section)
            .filter(q => !seenIds.includes(q.id))
            .filter(q => !questions.find(existing => existing.id === q.id));
          questions = [...questions, ...extraQs];
        }
        questions = questions.sort(() => Math.random() - 0.5);
      } catch (err) {
        console.error('Failed to load static fallback questions:', err);
      }
    }

    return questions.slice(0, count);
  } catch (error) {
    console.error('Question selection error (falling back to local pool):', error);
    try {
      const { loadAllStaticQuestions } = await import('@/lib/questionsData');
      const allStatic = loadAllStaticQuestions();
      let fallbackQs = allStatic
        .filter(q => q.section === section && q.companies.includes(companyKey))
        .filter(q => !seenIds.includes(q.id));

      if (fallbackQs.length < count) {
        const extraQs = allStatic
          .filter(q => q.section === section)
          .filter(q => !seenIds.includes(q.id))
          .filter(q => !fallbackQs.find(existing => existing.id === q.id));
        fallbackQs = [...fallbackQs, ...extraQs];
      }
      return fallbackQs.sort(() => Math.random() - 0.5).slice(0, count);
    } catch (fallbackErr) {
      console.error('Failed to load static fallback questions in catch block:', fallbackErr);
      return [];
    }
  }
}

/**
 * Build a full test paper for a company, splitting by sections.
 */
export async function buildTestPaper(companyKey, sections, totalQuestions, seenIds = []) {
  const perSection = Math.ceil(totalQuestions / sections.length);
  let allQuestions = [];

  for (const section of sections) {
    const sectionQs = await selectQuestions(companyKey, section, perSection, seenIds);
    allQuestions = [...allQuestions, ...sectionQs];
  }

  // Trim to exact count and group by section
  return allQuestions.slice(0, totalQuestions);
}
