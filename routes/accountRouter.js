import express from 'express';

import accountController from '../controllers/accountController.js';

const app = express();

app.post('/account', accountController.create);

app.get('/account/findMorePoors/:numero', accountController.findMorePoors);

app.get('/account/findMoreRichs/:numero', accountController.findMoreRichs);

app.get('/account', accountController.findAll);

app.get('/account/:agencia', accountController.mediaAgencia);

app.get('/account/:agencia/:conta', accountController.findOne);

app.put('/account/depositMoney', accountController.depositMoney);

app.put('/account/withdrawMoney', accountController.withdrawMoney);

app.put('/account/transferMoney', accountController.transferMoney);

app.put('/account/transferAccounts', accountController.transferAccounts);


app.put('/account/:id', accountController.update);

app.delete('/account/:agencia/:conta', accountController.remove);

export { app as accountRouter };
