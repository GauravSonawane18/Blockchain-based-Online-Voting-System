package com.major.evoting_system.dto;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
public class VoteDTOs {
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class OtpRequest { @NotNull private Long electionId; }
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class OtpVerifyRequest { @NotNull private Long electionId; @NotBlank private String otpCode; }
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class VoteReceiptResponse {
        private String transactionHash,nullifierHash,candidateName,electionTitle,blockchainExplorerUrl;
        private LocalDateTime votedAt;
    }
}
