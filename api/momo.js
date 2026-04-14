import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. CHUẨN HÓA DỮ LIỆU ĐẦU VÀO
    const amount = Math.round(Number(req.body.amount || 0));
    const orderId = String(req.body.orderId || `GSPRO_${Date.now()}`).trim();
    
    // Sử dụng chuỗi viết liền, không dấu, không gạch ngang để an toàn tuyệt đối
    const orderInfo = "ThanhToanGiaSuPro"; 
    const requestId = orderId;
    const extraData = ""; // Để trống theo yêu cầu của bạn

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Số tiền không hợp lệ" });
    }

    // 2. CẤU HÌNH THÔNG SỐ MOMO SANDBOX (V2)
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz"; // Secret Key chuẩn cho account MOMO test
    const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";

    const redirectUrl = "https://giasupro.vercel.app/dashboard";
    const ipnUrl = "https://giasupro.vercel.app/api/momo-ipn";
    const requestType = "captureWallet";

    // 3. TẠO OBJECT DỮ LIỆU GỐC (Dùng chung cho cả Hash và Body)
    const rawData = {
      accessKey,
      amount,
      extraData,
      ipnUrl,
      orderId,
      orderInfo,
      partnerCode,
      redirectUrl,
      requestId,
      requestType,
    };

    // 4. TẠO CHUỖI RAW SIGNATURE (Sắp xếp theo Alphabetical tự động)
    const rawSignature = Object.keys(rawData)
      .sort()
      .map((key) => `${key}=${rawData[key]}`)
      .join("&");

    // 5. MÃ HÓA HMAC-SHA256
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    // 6. TẠO REQUEST BODY ĐỂ GỬI SANG MOMO
    const requestBody = {
      ...rawData,
      signature,
      lang: "vi",
    };

    // 7. GỌI API MOMO
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Log kết quả từ MoMo để bạn debug trên Vercel dễ dàng hơn
    console.log("MoMo Response:", data);

    // 8. TRẢ KẾT QUẢ VỀ FRONTEND
    return res.status(200).json(data);

  } catch (error) {
    console.error("LỖI HỆ THỐNG:", error);
    return res.status(500).json({ error: "Lỗi kết nối đến MoMo" });
  }
}