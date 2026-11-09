package com.example.notification;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API: {@code POST /notifications} sends one notification and
 * {@code GET /notifications/count} returns how many have been sent.
 */
@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/count")
    public NotificationCount count() {
        return new NotificationCount(notificationService.sentCount());
    }

    @PostMapping
    public NotificationCount send() {
        return new NotificationCount(notificationService.send());
    }

    public record NotificationCount(long sent) {
    }
}
