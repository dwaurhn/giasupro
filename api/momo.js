import crypto from 'crypto';

export default async function handler(req, res) {
  // Chỉ nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Nhận dữ liệu từ Frontend gửi lên
  const { amount, orderInfo, orderId } = req.body;

  // Lắp bộ khóa MoMo Test của bạn vào đây
  const partnerCode = 'MOMO';
  const accessKey = 'F8BBA842ECF85';
  const secretKey = 'MomoTestSecretKey';
  const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';

  // Chuyển hướng người dùng về trang này sau khi thanh toán xong
  const redirectUrl = 'https://giasupro.vercel.app/dashboard'; 
  const ipnUrl = 'https://giasupro.vercel.app/api/momo-ipn';
  
  const requestType = 'captureWallet';
  const extraData = '';
  const requestId = orderId;

  // Thuật toán tạo chữ ký bảo mật (Signature) bắt buộc của MoMo
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  const requestBody = JSON.stringify({
    partnerCode,
    accessKey,
    requestId,
    amount: String(amount),
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'vi'
  });

  try {
    // Bắn yêu cầu sang server MoMo
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    });
    const data = await response.json();
    
    // Trả link thanh toán về cho Frontend
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}