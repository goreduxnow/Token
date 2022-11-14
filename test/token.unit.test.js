const { time, loadFixture, } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect }   = require("chai");
require("dotenv").config();

const name          = "ReduX";
const symbol        = "REDUX";
const decimals      = 18;
const supply        = 2000000000;

const DEPLOYER_WALLET = process.env.ACCOUNT;
const ZERO_ADDRESS    = "0x0000000000000000000000000000000000000000";
const DECIMAL_ZEROS   = "000000000000000000";

describe("UnitTest original code", function () {
  async function deployToken() {
    const [owner, otherAccount] = await ethers.getSigners();

    // Impersonate owner account
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [DEPLOYER_WALLET],
    });

    const deployer = await ethers.provider.getSigner(DEPLOYER_WALLET);

    await network.provider.send("hardhat_setBalance", [
      DEPLOYER_WALLET, 
      ethers.utils.parseEther('10.0').toHexString(),
    ]);

    const Token = await ethers.getContractFactory("Redux");
    const token = await Token.connect(deployer).deploy();

    return { token, deployer, otherAccount };
  }

  describe("ERC20 Functions", function () {
    it("name()", async function () {
      const { token } = await loadFixture(deployToken);
      expect(await token.name()).to.equal(name);
    });
    it("symbol()", async function () {
      const { token } = await loadFixture(deployToken);
      expect(await token.symbol()).to.equal(symbol);
    });
    it("decimals()", async function () {
      const { token } = await loadFixture(deployToken);
      expect(await token.decimals()).to.equal(decimals);
    });
    it("supply()", async function () {
      const { token } = await loadFixture(deployToken);
      expect(await token.totalSupply() / 10 ** 18).to.equal(supply);
    });
    it("balanceOf()", async function () {
      const { token } = await loadFixture(deployToken);
      expect(await token.balanceOf(DEPLOYER_WALLET) / 10 ** 18).to.equal(supply);
    });
    it("transfer()", async function () {
      const { 
        token, 
        deployer, 
        liquidityReceiver, 
        marketingFeeReceiver, 
        rndFeeReceiver, 
        otherAccount  
      } = await loadFixture(deployToken);
      await expect(token.connect(deployer).transfer(otherAccount.address, 1)).to.changeTokenBalances(
        token,
        [DEPLOYER_WALLET, otherAccount.address],
        [-1, 1]
      );
      await expect(token.connect(deployer).transfer(ZERO_ADDRESS, 1)).to.be.revertedWith("ERC20: transfer to the zero address");
    });
    it("allowance()", async function () {
      const { 
        token, 
        deployer, 
        liquidityReceiver, 
        marketingFeeReceiver, 
        rndFeeReceiver, 
        otherAccount  
      } = await loadFixture(deployToken);
      expect(await token.allowance(DEPLOYER_WALLET, otherAccount.address)).to.equal(0);
      await token.connect(deployer).approve(otherAccount.address, 10);
      expect(await token.allowance(DEPLOYER_WALLET, otherAccount.address)).to.equal(10);

    });
    it("approve()", async function () {
      const { 
        token, 
        deployer, 
        liquidityReceiver, 
        marketingFeeReceiver, 
        rndFeeReceiver, 
        otherAccount  
      } = await loadFixture(deployToken);
      expect(await token.allowance(DEPLOYER_WALLET, otherAccount.address)).to.equal(0);
      await token.connect(deployer).approve(otherAccount.address, 10);
      expect(await token.allowance(DEPLOYER_WALLET, otherAccount.address)).to.equal(10);

    });
    it("transferFrom()", async function () {
      const { 
        token, 
        deployer, 
        liquidityReceiver, 
        marketingFeeReceiver, 
        rndFeeReceiver, 
        otherAccount  
      } = await loadFixture(deployToken);
      expect(await token.allowance(DEPLOYER_WALLET, otherAccount.address)).to.equal(0);
      await token.connect(deployer).approve(otherAccount.address, 10);
      expect(await token.allowance(DEPLOYER_WALLET, otherAccount.address)).to.equal(10);

      await expect(token.connect(otherAccount).transferFrom(ZERO_ADDRESS, otherAccount.address, 1)).to.be.revertedWith("ERC20: insufficient allowance");
      await expect(token.connect(otherAccount).transferFrom(DEPLOYER_WALLET, ZERO_ADDRESS, 1)).to.be.revertedWith("ERC20: transfer to the zero address");

      await expect(token.connect(otherAccount).transferFrom(DEPLOYER_WALLET, otherAccount.address, 10)).to.changeTokenBalances(
        token,
        [DEPLOYER_WALLET, otherAccount.address],
        [-10, 10]
      );

    });
  });
  describe("Ownable Functions", function () {
    it("owner()", async function () {
      const { token } = await loadFixture(deployToken);
      expect(await token.owner()).to.equal(DEPLOYER_WALLET);
    });
    it("transferOwnership()", async function () {
      const { 
        token, 
        deployer, 
        liquidityReceiver, 
        marketingFeeReceiver, 
        rndFeeReceiver, 
        otherAccount  
      } = await loadFixture(deployToken);
      await expect(token.connect(otherAccount).transferOwnership(otherAccount.address)).to.be.revertedWith('Ownable: caller is not the owner');
      await token.connect(deployer).transferOwnership(otherAccount.address);
      expect(await token.owner()).to.equal(otherAccount.address);
    });
    it("renounceOwnership()", async function () {
      const { 
        token, 
        deployer, 
        liquidityReceiver, 
        marketingFeeReceiver, 
        rndFeeReceiver, 
        otherAccount  
      } = await loadFixture(deployToken);
      await expect(token.connect(otherAccount).renounceOwnership()).to.be.revertedWith('Ownable: caller is not the owner');
      await token.connect(deployer).renounceOwnership();
      expect(await token.owner()).to.equal(ZERO_ADDRESS);
    });
  });
  describe("Burn Functions", function () {
    it("burn()", async function () {
      const { token, deployer } = await loadFixture(deployToken);
      await expect(token.connect(deployer).burn(1000)).to.changeTokenBalance(
        token,
        DEPLOYER_WALLET,
        -1000
      );
    });
    it("burnFrom()", async function () {
      const { token, deployer, otherAccount } = await loadFixture(deployToken);
      await token.connect(deployer).transfer(otherAccount.address, 1000);
      await token.connect(otherAccount).approve(DEPLOYER_WALLET, 1000);
      await expect(token.connect(deployer).burnFrom(otherAccount.address, 1000)).to.changeTokenBalance(
        token,
        otherAccount.address,
        -1000
      );
    });
  });
  describe("Pause Functions", function () {
    it("pause()", async function () {
      const { token, deployer } = await loadFixture(deployToken);
      await token.pause();
      expect(await token.paused()).to.equal(true);
    });
    it("burnFrom()", async function () {
      const { token, deployer, otherAccount } = await loadFixture(deployToken);
      await token.pause();
      expect(await token.paused()).to.equal(true);
      await token.unpause();
      expect(await token.paused()).to.equal(false);
    });
  });
});

