import nodemailer from 'nodemailer';

async function sendPOEmail(po) {
  if (!po || !po.supplier || !po.supplier.email) throw new Error('Missing supplier email');
  // Configure your SMTP settings here
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: po.supplier.email,
    subject: `Purchase Order for ${po.item.name}`,
    text: `Dear ${po.supplier.name},\n\nPlease supply the following item:\n\nItem: ${po.item.name}\nQuantity: ${po.quantity}\n\nThank you.\n\n-- Automated System`
  };
  await transporter.sendMail(mailOptions);
}

export default sendPOEmail; 