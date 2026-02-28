package com.major.evoting_system.service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
@Service @RequiredArgsConstructor @Slf4j
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}") private String from;
    public void sendOtpEmail(String to,String name,String otp,String election,int mins) {
        try {
            MimeMessage m=mailSender.createMimeMessage(); MimeMessageHelper h=new MimeMessageHelper(m,true,"UTF-8");
            h.setFrom(from); h.setTo(to); h.setSubject("Voting OTP - "+election);
            h.setText("<div style='font-family:Arial;padding:20px'><h2>E-Voting OTP</h2><p>Hello <b>"+name+"</b></p><div style='background:#f0f0f0;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px'>"+otp+"</div><p style='color:red'>Expires in "+mins+" minutes</p></div>",true);
            mailSender.send(m);
        } catch(Exception e) { log.error("Email failed: {}",e.getMessage()); throw new RuntimeException("Email failed",e); }
    }
    public void sendVoterApprovalEmail(String to,String name,String voterId) {
        try { SimpleMailMessage m=new SimpleMailMessage(); m.setFrom(from); m.setTo(to); m.setSubject("Registration Approved!"); m.setText("Hello "+name+",\n\nApproved! Voter ID: "+voterId+"\n- E-Voting System"); mailSender.send(m); }
        catch(Exception e) { log.error("Email failed: {}",e.getMessage()); }
    }
    public void sendVoterRejectionEmail(String to,String name,String reason) {
        try { SimpleMailMessage m=new SimpleMailMessage(); m.setFrom(from); m.setTo(to); m.setSubject("Registration Update"); m.setText("Hello "+name+",\n\nNot approved. Reason: "+reason+"\n- E-Voting System"); mailSender.send(m); }
        catch(Exception e) { log.error("Email failed: {}",e.getMessage()); }
    }
}
