package com.major.evoting_system.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
@Configuration
public class Web3jConfig {
    @Value("${blockchain.rpc.url}") private String rpcUrl;
    @Bean public Web3j web3j() { return Web3j.build(new HttpService(rpcUrl)); }
}
