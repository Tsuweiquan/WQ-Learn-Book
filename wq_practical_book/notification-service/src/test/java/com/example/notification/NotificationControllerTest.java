package com.example.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MeterRegistry registry;

    @Test
    void sendingNotificationsUpdatesTheCountAndTheMetric() throws Exception {
        mockMvc.perform(get("/notifications/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sent").value(0));

        mockMvc.perform(post("/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sent").value(1));
        mockMvc.perform(post("/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sent").value(2));

        mockMvc.perform(get("/notifications/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sent").value(2));

        assertThat(registry.get("notifications.sent").counter().count()).isEqualTo(2.0);
    }
}
