import emailjs from '@emailjs/browser';

/**
 * Send real 6-digit OTP email using EmailJS to recipient inbox
 * Matching exact template variables: {{email}}, {{passcode}}, {{time}}
 */
export const sendOtpEmail = async (userEmail, otpCode) => {
  if (!userEmail) {
    alert("Please enter a valid email address first.");
    return false;
  }

  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_n6ti031';
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_7hhzpde';
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'zE-OjL0UYA0KjfK_s';

  // Calculate 15-minute expiry time string (e.g., "10:15 AM")
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Exact template parameter keys matching the EmailJS template:
  const templateParams = {
    email: userEmail.trim(),      // Matches {{email}} in "To Email"
    to_email: userEmail.trim(),   // Fallback alias
    passcode: otpCode,            // Matches {{passcode}} in template content
    time: expiryTime,             // Matches {{time}} in template content
  };

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    console.log('OTP Email Sent Successfully:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('EmailJS Send Error:', error);
    alert(`EmailJS Dispatch Error: ${error?.text || error?.message || 'Failed to send OTP'}`);
    return false;
  }
};
