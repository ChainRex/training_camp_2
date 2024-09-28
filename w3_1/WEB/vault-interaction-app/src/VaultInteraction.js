import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const VAULT_ADDRESS = '0x67a396b37e1d25C7aB17159F102627047077c5b5';
const TOKEN_ADDRESS = '0x0a6A2d617352710ddEeF445DC69786aE981ED11b';

const VAULT_ABI = [
    'function deposit(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public',
    'function withdraw(uint256 amount) public',
    'function balances(address) public view returns (uint256)'
];

const TOKEN_ABI = [
    'function approve(address spender, uint256 amount) public returns (bool)',
    'function balanceOf(address account) public view returns (uint256)',
    'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public',
    'function nonces(address owner) public view returns (uint256)'  // 添加这行
];

function VaultInteraction() {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [vaultContract, setVaultContract] = useState(null);
    const [tokenContract, setTokenContract] = useState(null);
    const [userAddress, setUserAddress] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        const init = async () => {
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
                const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

                setProvider(provider);
                setSigner(signer);
                setVaultContract(vault);
                setTokenContract(token);

                const address = await signer.getAddress();
                setUserAddress(address);
            }
        };

        init();
    }, []);

    const handleDeposit = async () => {
        if (!amount || !vaultContract || !tokenContract) return;

        try {
            const value = ethers.parseEther(amount);
            const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

            // 获取签名
            const nonce = await tokenContract.nonces(userAddress);
            const network = await provider.getNetwork();
            const domain = {
                name: 'RexToken',
                version: '1',
                chainId: network.chainId,
                verifyingContract: TOKEN_ADDRESS
            };
            const types = {
                Permit: [
                    { name: 'owner', type: 'address' },
                    { name: 'spender', type: 'address' },
                    { name: 'value', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            };
            const message = {
                owner: userAddress,
                spender: VAULT_ADDRESS,
                value: value.toString(),
                nonce: nonce.toString(),
                deadline
            };

            const signature = await signer.signTypedData(domain, types, message);
            const { v, r, s } = ethers.Signature.from(signature);

            // 调用deposit函数
            const tx = await vaultContract.deposit(value, deadline, v, r, s);
            await tx.wait();
            console.log('存款成功');
        } catch (error) {
            console.error('存款失败:', error);
        }
    };

    const handleWithdraw = async () => {
        if (!amount || !vaultContract) return;

        try {
            const value = ethers.parseEther(amount);
            const tx = await vaultContract.withdraw(value);
            await tx.wait();
            console.log('提款成功');
        } catch (error) {
            console.error('提款失败:', error);
        }
    };

    return (
        <div>
            <h1>Vault 交互</h1>
            <p>当前地址: {userAddress}</p>
            <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="输入金额（REX）"
            />
            <button onClick={handleDeposit}>存款</button>
            <button onClick={handleWithdraw}>提款</button>
        </div>
    );
}

export default VaultInteraction;