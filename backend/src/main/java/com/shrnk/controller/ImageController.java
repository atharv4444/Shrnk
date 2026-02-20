package com.shrnk.controller;

import com.shrnk.service.ImageService;
import com.shrnk.service.ProgressService;
import net.lingala.zip4j.ZipFile;
import net.lingala.zip4j.model.ZipParameters;
import net.lingala.zip4j.model.enums.CompressionMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/image")
public class ImageController {

    @Value("${shrnk.temp-dir}")
    private String tempDir;

    @Autowired
    private ImageService imageService;

    @Autowired
    private ProgressService progressService;

    /**
     * Upload images and resize them
     */
    @PostMapping("/resize")
    public ResponseEntity<Map<String, Object>> resizeImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("resizeOption") String resizeOption,
            @RequestParam(value = "stripMetadata", defaultValue = "false") boolean stripMetadata) {

        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> response = new HashMap<>();

        try {
            Path sessionDir = Paths.get(tempDir, sessionId);
            Path inputDir = sessionDir.resolve("input");
            Path outputDir = sessionDir.resolve("output");
            Path processedDir = sessionDir.resolve("processed");
            Files.createDirectories(inputDir);
            Files.createDirectories(outputDir);
            Files.createDirectories(processedDir);

            // Save uploaded files
            List<File> savedFiles = new ArrayList<>();
            long totalBytes = 0;
            for (MultipartFile mf : files) {
                File saved = inputDir.resolve(mf.getOriginalFilename()).toFile();
                try (InputStream is = mf.getInputStream();
                        OutputStream os = new BufferedOutputStream(new FileOutputStream(saved), 8192)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = is.read(buffer)) != -1) {
                        os.write(buffer, 0, read);
                    }
                }
                totalBytes += saved.length();
                savedFiles.add(saved);
            }

            // Process images in parallel
            final long total = totalBytes;
            List<File> processed = imageService.processBatch(savedFiles, resizeOption, processedDir, stripMetadata);

            // Zip the results
            File resultZip = outputDir.resolve("resized_images.zip").toFile();
            ZipFile zip = new ZipFile(resultZip);
            ZipParameters params = new ZipParameters();
            params.setCompressionMethod(CompressionMethod.DEFLATE);

            long processedBytes = 0;
            for (File f : processed) {
                zip.addFile(f, params);
                processedBytes += f.length();
                progressService.sendProgress(sessionId, processedBytes, total, "Packaging", f.getName());
            }

            progressService.sendComplete(sessionId);

            response.put("sessionId", sessionId);
            response.put("status", "complete");
            response.put("totalFiles", processed.size());
            response.put("fileName", resultZip.getName());
            response.put("size", resultZip.length());

            List<Map<String, Object>> fileDetails = new ArrayList<>();
            for (File f : processed) {
                Map<String, Object> detail = new HashMap<>();
                detail.put("name", f.getName());
                detail.put("size", f.length());
                fileDetails.add(detail);
            }
            response.put("files", fileDetails);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Strip metadata from uploaded images
     */
    @PostMapping("/strip-metadata")
    public ResponseEntity<Map<String, Object>> stripMetadata(
            @RequestParam("files") MultipartFile[] files) {

        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> response = new HashMap<>();

        try {
            Path sessionDir = Paths.get(tempDir, sessionId);
            Path inputDir = sessionDir.resolve("input");
            Path outputDir = sessionDir.resolve("output");
            Path processedDir = sessionDir.resolve("processed");
            Files.createDirectories(inputDir);
            Files.createDirectories(outputDir);
            Files.createDirectories(processedDir);

            List<File> savedFiles = new ArrayList<>();
            for (MultipartFile mf : files) {
                File saved = inputDir.resolve(mf.getOriginalFilename()).toFile();
                try (InputStream is = mf.getInputStream();
                        OutputStream os = new BufferedOutputStream(new FileOutputStream(saved), 8192)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = is.read(buffer)) != -1) {
                        os.write(buffer, 0, read);
                    }
                }
                savedFiles.add(saved);
            }

            List<File> processed = imageService.processBatch(savedFiles, null, processedDir, true);

            // Zip results
            File resultZip = outputDir.resolve("stripped_images.zip").toFile();
            ZipFile zip = new ZipFile(resultZip);
            ZipParameters params = new ZipParameters();
            params.setCompressionMethod(CompressionMethod.DEFLATE);
            for (File f : processed) {
                zip.addFile(f, params);
            }

            progressService.sendComplete(sessionId);

            response.put("sessionId", sessionId);
            response.put("status", "complete");
            response.put("totalFiles", processed.size());
            response.put("size", resultZip.length());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Download processed images
     */
    @GetMapping("/download/{sessionId}")
    public ResponseEntity<Resource> download(@PathVariable String sessionId) {
        try {
            Path outputDir = Paths.get(tempDir, sessionId, "output");
            if (!Files.exists(outputDir)) {
                return ResponseEntity.notFound().build();
            }

            Optional<Path> outputFile;
            try (var stream = Files.list(outputDir)) {
                outputFile = stream.filter(Files::isRegularFile).findFirst();
            }

            if (outputFile.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            File file = outputFile.get().toFile();
            FileSystemResource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(file.length())
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * SSE endpoint for progress
     */
    @GetMapping("/progress/{sessionId}")
    public SseEmitter progress(@PathVariable String sessionId) {
        return progressService.createEmitter(sessionId);
    }
}
