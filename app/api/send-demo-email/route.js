import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, college, company, size, roles, type } = body;

    // 1. Save to Firestore (Always do this as a secure backup)
    let docRef = null;
    if (adminDb) {
      try {
        docRef = await adminDb.collection("demo_inquiries").add({
          name: name || "",
          email: email || "",
          phone: phone || "",
          college: college || "",
          company: company || "",
          size: size || "",
          roles: roles || "",
          type: type || "unknown", // "college" or "recruiter"
          createdAt: new Date(),
        });
      } catch (dbErr) {
        console.error("Firebase save error for demo inquiry:", dbErr);
      }
    }

    // 2. Setup SMTP Transporter
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");

    let emailSent = false;
    let emailError = null;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const subject = `🚀 New Demo Request from ${name} (${type === "college" ? "College" : "Recruiter"})`;
        
        let htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0D9488; border-bottom: 2px solid #0D9488; padding-bottom: 10px; margin-top: 0;">New Demo Request Received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> ${phone}</p>
        `;

        if (type === "college") {
          htmlContent += `
            <p><strong>College/Institution:</strong> ${college}</p>
            <p><strong>Batch Size:</strong> ${size} students</p>
          `;
        } else {
          htmlContent += `
            <p><strong>Company/Organization:</strong> ${company}</p>
            <p><strong>Target Hiring Roles:</strong> ${roles}</p>
          `;
        }

        htmlContent += `
            <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin-top: 20px; padding: 10px; background-color: #f8fafc; border-radius: 6px; font-size: 11px; color: #64748b;">
              This inquiry has also been safely saved to the 'demo_inquiries' Firestore collection (ID: ${docRef ? docRef.id : 'N/A'}).
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"BridgeAI Demo Alerts" <${smtpUser}>`,
          to: "bridgeaimit@gmail.com",
          subject: subject,
          html: htmlContent,
        });

        emailSent = true;
      } catch (err) {
        console.error("Nodemailer send error:", err);
        emailError = err.message;
      }
    } else {
      console.warn("SMTP credentials missing. Demo request saved to Firestore but email not sent.");
    }

    return NextResponse.json({
      success: true,
      savedToDb: !!docRef,
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error("Error in demo email endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
