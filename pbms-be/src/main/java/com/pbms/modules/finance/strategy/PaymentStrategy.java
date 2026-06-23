package com.pbms.modules.finance.strategy;

public interface PaymentStrategy {
    
    /**
     * Tạo mã QR code hoặc URL thanh toán
     * @param amount Số tiền
     * @param orderId Mã đơn hàng
     * @return URL thanh toán hoặc QR Data
     */
    String generatePaymentUrl(double amount, String orderId);
    
    /**
     * Xác thực Webhook trả về từ Gateway
     * @param payload Chuỗi JSON hoặc query params
     * @param signature Chữ ký xác thực
     * @return Hợp lệ hay không
     */
    boolean verifyWebhookSignature(String payload, String signature);
    
    /**
     * Mã Gateway hỗ trợ
     */
    String getProviderCode();
}
