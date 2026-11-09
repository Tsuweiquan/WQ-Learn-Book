package com.example.notification;

import java.util.concurrent.atomic.AtomicLong;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final AtomicLong sent = new AtomicLong();
    private final Counter sentCounter;

    public NotificationService(MeterRegistry registry) {
        this.sentCounter = Counter.builder("notifications.sent")
                .description("Number of notifications sent")
                .register(registry);
    }

    /** "Sending" a notification only adds one to the counter. */
    public long send() {
        long total = sent.incrementAndGet();
        sentCounter.increment();
        log.info("Notification sent, total sent={}", total);
        return total;
    }

    public long sentCount() {
        return sent.get();
    }
}
