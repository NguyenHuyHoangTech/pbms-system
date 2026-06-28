package com.pbms.common.event;

import org.springframework.context.ApplicationEvent;
import java.time.LocalDateTime;

public class TimeFastForwardedEvent extends ApplicationEvent {
    
    private final LocalDateTime newSimulatedTime;

    public TimeFastForwardedEvent(Object source, LocalDateTime newSimulatedTime) {
        super(source);
        this.newSimulatedTime = newSimulatedTime;
    }

    public LocalDateTime getNewSimulatedTime() {
        return newSimulatedTime;
    }
}

