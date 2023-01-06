const { expect } = require("chai");


let Token20;
let token20;
let Account1;
let Account2;
let signer1;
let signer2
let userKey;
let userKeys1;
let userKeys2;

const getRandomNonce = () => (Math.random() * 64000) | 0;

describe("Test Token20 contract", async function () {
  beforeEach("Deploy contract", async function () {
    Token20 = await locklift.factory.getContract("Token20");

    expect(Token20.code).not.to.equal(undefined, "Code should be available");
    expect(Token20.abi).not.to.equal(undefined, "ABI should be available");


    Account1 = await locklift.factory.getAccount('Account');
    Account2 = await locklift.factory.getAccount('Account')
    
    
    this.timeout(200000);

      [userKey] = await locklift.keys.getKeyPairs();
      [userKeys1] = await locklift.keys.getKeyPairs();
      [userKeys2] = await locklift.keys.getKeyPairs();
      
     
     token20 = await locklift.giver.deployContract({
      contract: Token20,
      constructorParams: {
        name_: "Token20",
        symbol_: "TKN20",
        decimals_: 10,
        totalSupply_: 1000000,
      },
      initParams: {
        _nonce: getRandomNonce(),
      },
      keyPair: userKey,
    });

    expect(token20.address).to.be.a("string");

    

     signer1 = await locklift.giver.deployContract({
      contract: Account1,
      constructorParams: {},
      initParams: {
        _randomNonce: getRandomNonce(),
      },
      keyPair: userKeys1,
    });
    
    signer1.setKeyPair(userKeys1);

    

    const signer1Balance = await locklift.ton.getBalance(signer1.address);

   

    signer2 = await locklift.giver.deployContract({
      contract: Account2,
      constructorParams: {},
      initParams: {
        _randomNonce: getRandomNonce(),
      },
      keyPair: userKeys2,
    });
    
    signer2.setKeyPair(userKeys2);

    

  });
  
  it("Should check symbol of token", async () => {
    const response = await token20.call({
      method: "symbol",
      params: {},
    });

    expect(response).to.be.eq("TKN20");
  });
  it("Should check number of decimals", async () => {
    const response = await token20.call({
      method: "decimals",
      params: {},
    });

    expect(response.toNumber()).to.be.eq(10);
  });
  it("Should check tottal supply of tokens", async () => {
    const response = await token20.call({
      method: "totalSupply",
      params: {},
    });

    expect(response.toNumber()).to.be.eq(1000000);
  });

  it('Should mint tokens to an account and than burn some amount from that account', async ()=>{
    
    //mint tokens
    await token20.run({
      method: 'mint',
      params: {
        amount: 100,
        account: signer1.address
      },
      keyPair: userKey

    })

     signer1Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer1.address}
    })
    expect(signer1Balance.toNumber()).to.eq(100)

    //burn tokens
    await token20.run({
      method: 'burn',
      params: {
        amount: 50,
        account: signer1.address
      },
      keyPair: userKey

    })

     signer1Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer1.address}
    })
   expect(signer1Balance.toNumber()).to.eq(50)

  }).timeout(20000)

  it.skip('should fail minting token using non-contract pubkey', async() => {

    try{
      await token20.run({
        method: 'mint',
        params: {
          amount: 100,
          account: signer1.address
        },
        keyPair: userKeys2,
        
      })
     throw new Error('Did not revert')
    }catch (e) {
      if (e.toString().indexOf('102') == -1) throw new Error('Transaction failed with wrong error, expected code 102, but got: ', e);
    }
    
   }).timeout(20000)

  it("Should do a transfer to account", async () => {
    
    //first mint smoe tokens to account1
  let signer1Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer1.address}
    })

    let signer2Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer2.address}
    })

    expect(signer1Balance.toNumber()).to.eq(0)
    expect(signer2Balance.toNumber()).to.eq(0)

    await token20.run({
      method: 'mint',
      params: {
        amount: 100,
        account: signer1.address
      },
      keyPair: userKey

    })

     signer1Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer1.address}
    })

     signer2Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer2.address}
    })

    expect(signer1Balance.toNumber()).to.eq(100)
    expect(signer2Balance.toNumber()).to.eq(0)

    //transfer tokens from account1 to account2
     await signer1.runTarget({
      contract: token20,
      method: 'transfer',
      params:{
        to: signer2.address,
        amount: 50,
      }
    })

    signer1Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer1.address}
    })

     signer2Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer2.address}
    })

    expect(signer1Balance.toNumber()).to.eq(50)
    expect(signer2Balance.toNumber()).to.eq(50)
  
    }).timeout(20000)
    
    it('should fail transfering on insufficient balance', async function () {
      this.timeout(20000);
  
      let signer1Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer1.address}
      })
  
      let signer2Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer2.address}
      })
  
      expect(signer1Balance.toNumber()).to.eq(0)
      expect(signer2Balance.toNumber()).to.eq(0)
  
      try {
        // transfer from user1 to user2
        await signer1.runTarget({
          contract: token20,
          method: 'transfer',
          params: {
            to: signer2.address,
            amount: 50
          },
          tracing: true
        });
  
        throw new Error('Transaction did not fail.');
      } catch (e) {
        if (e.toString().indexOf('105') == -1) throw new Error('Transaction failed with wrong error, expected code 105, but got: ', e);
      }
    });

    it('Should transfer from another account', async()=>{

      let signer1Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer1.address}
      })
  
      let signer2Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer2.address}
      })
  
      expect(signer1Balance.toNumber()).to.eq(0)
      expect(signer2Balance.toNumber()).to.eq(0)
  
      await token20.run({
        method: 'mint',
        params: {
          amount: 100,
          account: signer1.address
        },
        keyPair: userKey
  
      })
  
       signer1Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer1.address}
      })
  
       signer2Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer2.address}
      })

      expect(signer1Balance.toNumber()).to.eq(100)
      expect(signer2Balance.toNumber()).to.eq(0)

      //giving alowance

     

      await signer1.runTarget({
        contract: token20,
        method: 'allowance',
        params: {
          spender: signer2.address,
          amount: 50
        }
      });

      
    // transferFrom user1 to user2 from user2
    await signer2.runTarget({
      contract: token20,
      method: 'transferFrom',
      params: {
        from: signer1.address,
        to: signer2.address,
        amount: 25
      }
    });

    signer1Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer1.address}
    })

     signer2Balance = await token20.call({
      method: 'balanceOf',
      params: {account: signer2.address}
    })

    expect(signer1Balance.toNumber()).to.eq(75)
    expect(signer2Balance.toNumber()).to.eq(25)

    }).timeout(2000000)

    it('Should fail transfer from another account on incuficiante allowance', async()=>{

      let signer1Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer1.address}
      })
  
      let signer2Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer2.address}
      })
  
      expect(signer1Balance.toNumber()).to.eq(0)
      expect(signer2Balance.toNumber()).to.eq(0)
  
      await token20.run({
        method: 'mint',
        params: {
          amount: 100,
          account: signer1.address
        },
        keyPair: userKey
  
      })
  
       signer1Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer1.address}
      })
  
       signer2Balance = await token20.call({
        method: 'balanceOf',
        params: {account: signer2.address}
      })

      expect(signer1Balance.toNumber()).to.eq(100)
      expect(signer2Balance.toNumber()).to.eq(0)

      //giving alowance

      await signer1.runTarget({
        contract: token20,
        method: 'allowance',
        params: {
          spender: signer2.address,
          amount: 50
        }
      });

      // transferFrom user1 to user2 from user2
    
     try{
      await signer2.runTarget({
        contract: token20,
        method: 'transferFrom',
        params: {
          from: signer1.address,
          to: signer2.address,
          amount: 75
        },
        tracing: true
      });
      throw new Error('Transaction did not fail.');
    } catch (e) {
      if (e.toString().indexOf('106') == -1) throw new Error('Transaction failed with wrong error, expected code 106, but got: ', e);
    }
      
    }).timeout(20000);
});
