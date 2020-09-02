import { db } from '../models/index.js';

const Account = db.account;

const create = async (req, res) => {
  const account = new Account({
    agencia: req.body.agencia,
    conta: req.body.conta,
    name: req.body.name,
    balance: req.body.balance,
  });

  try {
    const data = await account.save();

    res.send(data);
  } catch (error) {
    res.status(500).send('Erro ao salvar o cliente ' + error);
  }
};

const findAll = async (req, res) => {
  try {
    const data = await Account.find();

    res.send(data);
  } catch (error) {
    res.status(500).send('Erro ao buscar todos os podcasts');
  }
};


const findMoreRichs = async (req, res) => {
  const numero= parseInt(req.params.numero);

  try {
    const data = await Account.find().sort({balance:-1}).limit(numero);
    res.send(data);
  } catch (error) {
    res.status(500).send('Erro ao buscar todos os clientes mais ricos '+ error);
  }
};

const findMorePoors = async (req, res) => {
  const numero= parseInt(req.params.numero);
  try {
    const data = await Account.find().sort({balance:1}).limit(numero);
    res.send(data);
  } catch (error) {
    res.status(500).send('Erro ao buscar todos os clientes mais pobres '+ error);
  }
};

const mediaAgencia = async (req, res) => {
  const agencia = req.params.agencia
  try {
    const data = await Account.aggregate([
      // { 
      //   $match: {
      //     agencia:{$eq:agencia}
      //   }
      // },
      {
        $group: {
          _id: "$agencia",
          media: {
            $avg: "$balance"
          },
          min: {
            $min: "$balance"
          },
          max: {
            $max: "$balance"
          }
        }
      }
    ]);

    res.send(data);
  } catch (error) {
    res.status(500).send('Erro ao buscar a agência: '+error);
  }
};

const findOne = async (req, res) => {
  const {agencia, conta} = req.params;

  try {
    const data = await Account.findOne({ agencia: agencia, conta: conta });

    if (!data) {
      res.send('Nao encontrato o cliente da agência: ' + agencia + '/ Conta: '+conta);
    } else {
      res.send(data);
    }
  } catch (error) {
    res.status(500).send('Erro ao buscar o cliente id: ' + error);
  }
};

const update = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await Account.findByIdAndUpdate({ _id: id }, req.body, {
      new: true,
    });

    if (!data) {
      res.send('Nao encontrado o cliente id: ' + id);
    } else {
      res.send(data);
    }
  } catch (error) {
    res.status(500).send('Erro ao atualizar o cliente id: ' + id + ' ' + error);
  }
};

const depositMoney = async (req, res) => {
  const {agencia, conta} = req.body;
  let deposit = req.body.deposit;
  deposit = deposit<0?deposit*-1:deposit;

  try {
    const data = await Account.findOneAndUpdate({ agencia: agencia,conta:conta }, { $inc: {balance: deposit}}, {
      new: true,
    });

    if (!data) {
      res.send('Nao encontrado o cliente da agência: ' + agencia + ' e da conta ' +conta);
    } else {

      res.send(data);
    }
  } catch (error) {
    res.status(500).send('Erro ao atualizar o cliente:' + error);
  }
};

const withdrawMoney = async (req, res) => {
  const {agencia, conta} = req.body;
  let withdraw = req.body.withdraw;
  withdraw = withdraw>0 ?(withdraw*-1)-1: withdraw-1;

  try {
    const account = await Account.findOne({agencia: agencia,conta:conta});

    if (!account) {
      res.send('Nao encontrado o cliente da agência: ' + agencia + ' e da conta ' +conta);
    } else {
      
      if(account.balance+withdraw<0){
        res.send('Valor do saque maior que o disponível: R$'+ account.balance +' disponíveis para retirada.');
      }else{
        const data = await Account.findOneAndUpdate({ agencia: agencia,conta:conta }, { $inc: {balance: withdraw}}, {
          new: true, });
        res.send(data);
      }
    }
  } catch (error) {
    res.status(500).send('Erro ao atualizar o cliente:' + error);
  }
};


const transferMoney = async (req, res) => {
  const {contaOrigem, contaDestino} = req.body;
  let value = req.body.value;
  value<0?(value*-1)+1:value+1;
  const taxe = 8;
  
  try {
    const origem = await Account.findOne({conta: contaOrigem});
    const destino = await Account.findOne({conta: contaDestino});


    if (!origem) {
      res.send('Não encontrado o cliente da conta ' +contaOrigem);
    } else if(!destino){
      res.send('Não encontrado o cliente da conta ' +contaDestino);
    } else{

      let withdraw = 0;
      origem.agencia!==destino.agencia?withdraw=(value+taxe)*-1:withdraw=value*-1;

      if(origem.balance+withdraw<0){
        res.send('Valor da transferência maior que o disponível: R$'+ (origem.balance-taxe) +' disponíveis pra transferência.');
      }else{

        const newOrigem = await Account.findOneAndUpdate({ conta:contaOrigem }, { $inc: {balance: withdraw}}, {
          new: true, });
        
        await Account.findOneAndUpdate({conta:contaDestino }, { $inc: {balance: value}}, {
          new: true, });
      
      res.send('Transferência de '+value+' efetuado com sucesso: R$'+ (newOrigem.balance) +' disponíveis na origem.');
      }
    } 
  } catch (error) {
    res.status(500).send('Erro ao efetuar transferência:' + error);
  }
};

const transferAccounts = async (req, res)=> {
  try {

    const sort = {$sort: {"balance": 1}}
    const group = {$group: {_id:"$agencia", balance:{$max:"$balance" }, doc:{$last:"$$ROOT"} }}
    
    const clients = await Account.aggregate([sort, group]);

    for (let value of clients) {
      let client = value.doc;
      await Account.updateOne({_id: client._id},{agencia:99});
    }

    const transferedAccounts = await Account.find({agencia:99});
        
    res.send(transferedAccounts);
}catch(error){
    res.send(error);
}
}

const remove = async (req, res) => {
  const {agencia, conta} = req.params;

  try {
    const data = await Account.findOneAndDelete({ agencia: agencia, conta:conta });

    if (!data) {
      res.send('Nao encontrato o cliente da Agência: ' + agencia + ' / Conta: '+conta);
    } else {
      const count = await Account.countDocuments({ agencia: agencia });
      res.send('Conta excluída com sucesso, existem '+ count + ' outras contas nesta agência.');
    }
  } catch (error) {
    res.status(500).send('Erro ao excluir o cliente id: ' + id + ' ' + error);
  }
};

export default { create, findAll, findMorePoors, findMoreRichs, findOne, update, remove, depositMoney, withdrawMoney, transferMoney, mediaAgencia, transferAccounts };
