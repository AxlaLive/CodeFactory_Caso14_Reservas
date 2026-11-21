package com.codefactory.reservas.controller;

import com.codefactory.reservas.dto.ClinicalSummaryRequest;
import com.codefactory.reservas.dto.ClinicalSummaryResponse;
import com.codefactory.reservas.service.ClinicalSummaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/historias-clinicas")
public class ClinicalSummaryController {

    private final ClinicalSummaryService clinicalSummaryService;

    public ClinicalSummaryController(ClinicalSummaryService clinicalSummaryService) {
        this.clinicalSummaryService = clinicalSummaryService;
    }

    @PostMapping("/resumen-ia")
    public ResponseEntity<ClinicalSummaryResponse> generateSummary(
            @RequestBody(required = false) ClinicalSummaryRequest request) {
        return ResponseEntity.ok(clinicalSummaryService.generate(request));
    }
}
