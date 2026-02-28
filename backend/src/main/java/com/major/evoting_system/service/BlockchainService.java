package com.major.evoting_system.service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.*;
import org.web3j.abi.datatypes.*;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.*;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.*;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.utils.Numeric;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.*;
@Service @RequiredArgsConstructor @Slf4j
public class BlockchainService {
    private final Web3j web3j;
    @Value("${blockchain.admin.private.key}") private String adminKey;
    @Value("${blockchain.contract.address}") private String contractAddr;
    @Value("${blockchain.election.salt}") private String salt;
    public String generateNullifierHash(String voterAddress) {
        try {
            byte[] addr=Numeric.hexStringToByteArray(voterAddress);
            byte[] s=salt.getBytes(StandardCharsets.UTF_8),sp=new byte[32]; System.arraycopy(s,0,sp,0,Math.min(s.length,32));
            byte[] packed=new byte[52]; System.arraycopy(addr,0,packed,0,20); System.arraycopy(sp,0,packed,20,32);
            return Numeric.toHexString(Hash.sha3(packed));
        } catch(Exception e) { throw new RuntimeException("Hash failed",e); }
    }
    public String registerVoterOnChain(String addr) throws Exception {
        return send(new Function("registerVoter",Arrays.asList(new Address(addr)),Collections.emptyList()));
    }
    public String addCandidateOnChain(String name,String party) throws Exception {
        return send(new Function("addCandidate",Arrays.asList(new Utf8String(name),new Utf8String(party)),Collections.emptyList()));
    }
    public String startElectionOnChain() throws Exception { return send(new Function("startElection",Collections.emptyList(),Collections.emptyList())); }
    public String endElectionOnChain() throws Exception { return send(new Function("endElection",Collections.emptyList(),Collections.emptyList())); }
    public BigInteger getVoteCountFromChain(BigInteger candidateId) throws Exception {
        Function fn=new Function("getVotes",Arrays.asList(new Uint256(candidateId)),Arrays.asList(new TypeReference<Uint256>(){}));
        EthCall r=web3j.ethCall(Transaction.createEthCallTransaction(null,contractAddr,FunctionEncoder.encode(fn)),DefaultBlockParameterName.LATEST).send();
        List<Type> d=FunctionReturnDecoder.decode(r.getValue(),fn.getOutputParameters());
        return d.isEmpty()?BigInteger.ZERO:((Uint256)d.get(0)).getValue();
    }
    public boolean verifyTransactionHash(String txHash) {
        try { return web3j.ethGetTransactionReceipt(txHash).send().getTransactionReceipt().map(r->"0x1".equals(r.getStatus())).orElse(false); }
        catch(Exception e) { log.error("TX verify: {}",e.getMessage()); return false; }
    }
    private String send(Function fn) throws Exception {
        Credentials c=Credentials.create(adminKey); String enc=FunctionEncoder.encode(fn);
        BigInteger nonce=web3j.ethGetTransactionCount(c.getAddress(),DefaultBlockParameterName.LATEST).send().getTransactionCount();
        RawTransaction raw=RawTransaction.createTransaction(nonce,DefaultGasProvider.GAS_PRICE,DefaultGasProvider.GAS_LIMIT,contractAddr,enc);
        EthSendTransaction sent=web3j.ethSendRawTransaction(Numeric.toHexString(TransactionEncoder.signMessage(raw,c))).send();
        if(sent.hasError()) throw new RuntimeException("TX failed: "+sent.getError().getMessage());
        return sent.getTransactionHash();
    }
}
