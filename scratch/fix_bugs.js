const fs = require('fs');

let code = fs.readFileSync('app/smart-interview/page.js', 'utf8');

const badHandleViolation = `      const timestamp = new Date().toISOString();
      dispatch({ type: 'SET_INTEGRITY', payload: { violations: (prev } }) => {
        const nextViolations = [...prev, { type, timestamp }];
        const count = nextViolations.length;
        
        let newScore = 100;
        if (count === 1) newScore = 85;
        else if (count === 2) newScore = 60;
        else if (count >= 3) newScore = 30;
        dispatch({ type: 'SET_INTEGRITY', payload: { integrityScore: newScore } });

        if (count === 1) {
          toast.error("Warning: Tab switching detected. Please focus on the interview.", { duration: 5000 });
        } else if (count === 2) {
          toast.error("Final Warning: Repeated switching will flag this interview.", { duration: 6000 });
        } else {
          toast.error("Interview Flagged: Multiple window switches detected.", { duration: 6000 });
        }

        return nextViolations;
      });
    };`;

const goodHandleViolation = `      const timestamp = new Date().toISOString();
      const nextViolations = [...state.integrity.violations, { type, timestamp }];
      const count = nextViolations.length;
      
      let newScore = 100;
      if (count === 1) newScore = 85;
      else if (count === 2) newScore = 60;
      else if (count >= 3) newScore = 30;
      
      dispatch({ type: 'SET_INTEGRITY', payload: { violations: nextViolations, integrityScore: newScore } });

      if (count === 1) {
        toast.error("Warning: Tab switching detected. Please focus on the interview.", { duration: 5000 });
      } else if (count === 2) {
        toast.error("Final Warning: Repeated switching will flag this interview.", { duration: 6000 });
      } else {
        toast.error("Interview Flagged: Multiple window switches detected.", { duration: 6000 });
      }
    };`;

code = code.replace(badHandleViolation, goodHandleViolation);

// Fix useEffect deps
code = code.replace(/window\.removeEventListener\("blur", handleBlur\);\n    };\n  }, \[state\.status\]\);/g, `window.removeEventListener("blur", handleBlur);\n    };\n  }, [state.status, state.integrity.violations]);`);

// Fix shorthand bug
code = code.replace(
  "console.log('submitAnswer called:', { answer, shouldFinish, mode: state.config.mode, state.engine.currentQuestion });",
  "console.log('submitAnswer called:', { answer, shouldFinish, mode: state.config.mode, currentQuestion: state.engine.currentQuestion });"
);

fs.writeFileSync('app/smart-interview/page.js', code);
console.log('Bugs fixed');
