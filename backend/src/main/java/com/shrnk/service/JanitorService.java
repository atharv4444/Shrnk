package com.shrnk.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class JanitorService {

    private static final Logger log = LoggerFactory.getLogger(JanitorService.class);

    @Value("${shrnk.temp-dir}")
    private String tempDir;

    @Value("${shrnk.janitor.max-age-minutes}")
    private int maxAgeMinutes;

    @Scheduled(fixedRateString = "${shrnk.janitor.interval}")
    public void cleanupExpiredSessions() {
        log.info("[Janitor] Running cleanup cycle...");

        Path tempPath = Paths.get(tempDir);
        if (!Files.exists(tempPath)) {
            log.info("[Janitor] Temp directory does not exist, skipping.");
            return;
        }

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(tempPath)) {
            int cleaned = 0;
            for (Path sessionDir : stream) {
                if (!Files.isDirectory(sessionDir))
                    continue;

                BasicFileAttributes attrs = Files.readAttributes(sessionDir, BasicFileAttributes.class);
                Instant created = attrs.creationTime().toInstant();

                if (created.plus(maxAgeMinutes, ChronoUnit.MINUTES).isBefore(Instant.now())) {
                    deleteRecursively(sessionDir);
                    cleaned++;
                    log.info("[Janitor] Cleaned session: {}", sessionDir.getFileName());
                }
            }
            log.info("[Janitor] Cleanup complete. Removed {} session(s).", cleaned);
        } catch (IOException e) {
            log.error("[Janitor] Error during cleanup", e);
        }
    }

    private void deleteRecursively(Path path) throws IOException {
        Files.walkFileTree(path, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.delete(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                Files.delete(dir);
                return FileVisitResult.CONTINUE;
            }
        });
    }
}
