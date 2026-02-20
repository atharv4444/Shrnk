package com.shrnk.service;

import com.shrnk.model.ProgressEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ProgressService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final Map<String, Long> startTimes = new ConcurrentHashMap<>();

    public SseEmitter createEmitter(String sessionId) {
        SseEmitter emitter = new SseEmitter(600_000L); // 10 min timeout
        emitters.put(sessionId, emitter);
        startTimes.put(sessionId, System.currentTimeMillis());

        emitter.onCompletion(() -> {
            emitters.remove(sessionId);
            startTimes.remove(sessionId);
        });
        emitter.onTimeout(() -> {
            emitters.remove(sessionId);
            startTimes.remove(sessionId);
        });
        emitter.onError(e -> {
            emitters.remove(sessionId);
            startTimes.remove(sessionId);
        });

        return emitter;
    }

    public void sendProgress(String sessionId, long bytesProcessed, long totalBytes, String status,
            String currentFile) {
        SseEmitter emitter = emitters.get(sessionId);
        if (emitter == null)
            return;

        double percent = totalBytes > 0 ? (double) bytesProcessed / totalBytes * 100 : 0;
        String eta = calculateEta(sessionId, bytesProcessed, totalBytes);

        ProgressEvent event = new ProgressEvent(sessionId, percent, bytesProcessed, totalBytes, eta, status,
                currentFile);

        try {
            emitter.send(SseEmitter.event()
                    .name("progress")
                    .data(event));
        } catch (IOException e) {
            emitters.remove(sessionId);
            startTimes.remove(sessionId);
        }
    }

    public void sendComplete(String sessionId) {
        SseEmitter emitter = emitters.get(sessionId);
        if (emitter == null)
            return;

        try {
            ProgressEvent event = new ProgressEvent(sessionId, 100, 0, 0, "0s", "complete", "");
            emitter.send(SseEmitter.event().name("complete").data(event));
            emitter.complete();
        } catch (IOException e) {
            // Silently ignore
        } finally {
            emitters.remove(sessionId);
            startTimes.remove(sessionId);
        }
    }

    public void sendError(String sessionId, String errorMessage) {
        SseEmitter emitter = emitters.get(sessionId);
        if (emitter == null)
            return;

        try {
            ProgressEvent event = new ProgressEvent(sessionId, 0, 0, 0, "", "error", errorMessage);
            emitter.send(SseEmitter.event().name("error").data(event));
            emitter.complete();
        } catch (IOException e) {
            // Silently ignore
        } finally {
            emitters.remove(sessionId);
            startTimes.remove(sessionId);
        }
    }

    private String calculateEta(String sessionId, long bytesProcessed, long totalBytes) {
        Long startTime = startTimes.get(sessionId);
        if (startTime == null || bytesProcessed <= 0)
            return "Calculating...";

        long elapsed = System.currentTimeMillis() - startTime;
        double rate = (double) bytesProcessed / elapsed; // bytes per ms
        long remaining = totalBytes - bytesProcessed;
        long etaMs = (long) (remaining / rate);

        if (etaMs < 1000)
            return "< 1s";
        if (etaMs < 60000)
            return (etaMs / 1000) + "s";
        return (etaMs / 60000) + "m " + ((etaMs % 60000) / 1000) + "s";
    }
}
