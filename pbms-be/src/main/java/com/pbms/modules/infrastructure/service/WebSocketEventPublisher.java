package com.pbms.modules.infrastructure.service;

import com.pbms.common.dto.WsMessageWrapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Gửi tin nhắn Broadcast (Tất cả những ai subscribe Topic đều nhận được)
     * @param topic Destination (VD: "/topic/slots/status")
     * @param eventType Loại sự kiện (VD: "SLOT_UPDATED")
     * @param payload Dữ liệu lõi
     */
    public void broadcastEvent(String topic, String eventType, Object payload) {
        WsMessageWrapper<Object> message = WsMessageWrapper.of(eventType, payload);
        messagingTemplate.convertAndSend(topic, message);
    }

    /**
     * Gửi tin nhắn Broadcast khẩn cấp
     */
    public void broadcastCriticalEvent(String topic, String eventType, Object payload) {
        WsMessageWrapper<Object> message = WsMessageWrapper.of(eventType, "CRITICAL", payload);
        messagingTemplate.convertAndSend(topic, message);
    }

    /**
     * Gửi tin nhắn Unicast cho một User cụ thể (Ví dụ màn hình Gateway của nhân viên)
     * @param username Email hoặc ID của User
     * @param queue Destination queue (VD: "/queue/gates/GATE_IN_01/scans")
     * @param eventType Loại sự kiện
     * @param payload Dữ liệu lõi
     */
    public void unicastEvent(String username, String queue, String eventType, Object payload) {
        WsMessageWrapper<Object> message = WsMessageWrapper.of(eventType, payload);
        messagingTemplate.convertAndSendToUser(username, queue, message);
    }
}
