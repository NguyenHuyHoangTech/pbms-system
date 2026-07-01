package com.pbms.modules.finance.strategy;

import com.pbms.modules.system.domain.SystemConfig;
import com.pbms.modules.system.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.payos.PayOS;
import vn.payos.type.CheckoutResponseData;
import vn.payos.type.ItemData;
import vn.payos.type.PaymentData;
import vn.payos.type.PaymentLinkData;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class PayOsStrategy implements PaymentStrategy {

    private final SystemConfigService systemConfigService;

    private PayOS getPayOS() {
        SystemConfig clientIdConfig = systemConfigService.getConfigByKey("PAYOS_CLIENT_ID");
        SystemConfig apiKeyConfig = systemConfigService.getConfigByKey("PAYOS_API_KEY");
        SystemConfig checksumKeyConfig = systemConfigService.getConfigByKey("PAYOS_CHECKSUM_KEY");

        return new PayOS(clientIdConfig.getConfigValue(), apiKeyConfig.getConfigValue(), checksumKeyConfig.getConfigValue());
    }

    @Override
    public String generatePaymentUrl(double amount, String orderId) {
        return generatePayOsLink(amount, orderId).get("checkoutUrl");
    }

    public Map<String, String> generatePayOsLink(double amount, String orderId) {
        try {
            PayOS payOS = getPayOS();
            
            // Generate a unique integer orderCode based on timestamp to comply with PayOS requirements
            long orderCode = System.currentTimeMillis() % 1000000000L;
            
            ItemData item = ItemData.builder().name("Parking Service").quantity(1).price((int) amount).build();
            
            PaymentData paymentData = PaymentData.builder()
                    .orderCode(orderCode)
                    .amount((int) amount)
                    .description("Payment " + orderCode)
                    // The URLs will just be fallbacks. The frontend typically handles the redirect anyway.
                    .returnUrl("http://localhost:5173/success")
                    .cancelUrl("http://localhost:5173/cancel")
                    .item(item)
                    .build();

            CheckoutResponseData data = payOS.createPaymentLink(paymentData);
            
            Map<String, String> result = new HashMap<>();
            result.put("checkoutUrl", data.getCheckoutUrl());
            result.put("qrCode", data.getQrCode()); // VietQR string
            result.put("orderCode", String.valueOf(orderCode));
            return result;
        } catch (Exception e) {
            log.error("Error creating PayOS order: {}", e.getMessage());
            throw new RuntimeException("Cannot create PayOS payment link", e);
        }
    }

    public boolean captureOrder(String orderCodeStr) {
        try {
            long orderCode = Long.parseLong(orderCodeStr);
            PayOS payOS = getPayOS();
            PaymentLinkData data = payOS.getPaymentLinkInformation(orderCode);
            if (data != null && "PAID".equals(data.getStatus())) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error checking PayOS order: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean verifyWebhookSignature(String payload, String signature) {
        return true;
    }

    @Override
    public String getProviderCode() {
        return "PAYOS";
    }
}
