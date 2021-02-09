const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const Clarifai = require('clarifai');
const capp = new Clarifai.App({
 apiKey: 'b9ec11ebc4684a1d891d528d9a325de4'
});

const register = require('./controllers/register');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'pass',
    database : 'smartbrain'
  }
});

/*db.select('*').from('users').then(data => {
	console.log(data);
});*/

const app = express();

//app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

const database = {
	users: [
		{
			id: '123',
			name: 'John',
			email: 'john@gmail.com',
			password: 'cookies',
			entries: 0,
			joined: new Date()
		},
		{
			id: '124',
			name: 'Sally',
			email: 'sally@gmail.com',
			password: 'bananas',
			entries: 0,
			joined: new Date()
		}
	] 
}

app.get('/', (req, res) => {
	res.send(database.users);
});

app.post('/signin', (req, res) => {
	/*// Load hash from your password DB.
	bcrypt.compare("apples", '$2a$10$oulws0Oqoqhc24r0Z/VW3uNqnxIpqq80nkc1WHdJXqg8jR37GJab2', function(err, res) {
		// res == true
		console.log('first guess', res);
	});
	bcrypt.compare("veggies", '$2a$10$oulws0Oqoqhc24r0Z/VW3uNqnxIpqq80nkc1WHdJXqg8jR37GJab2', function(err, res) {
		// res = false
		console.log('second guess', res);
	});*/
	/*
	if (req.body.email === database.users[0].email && req.body.password === database.users[0].password) {
		res.json(database.users[0]);
	} else {
		res.status(400).json('error logging in');
	}*/
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json('Incorrect form submission');
	}
	
	db.select('email', 'hash').from('login')
		.where('email', '=', email)
		.then(data => {
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if (isValid) {
				return db.select('*').from('users')
					.where('email', '=', email)
					.then(user => {
						res.json(user[0])
					})
					.catch(err => res.status(400).json('Unable to get user'));
			} else {
				res.status(400).json('wrong credentials');
			}
		})
		.catch(err => res.status(400).json('Wrong credentials'));
	
});


app.post('/register', (req, res) => { register.handleRegister(req, res, db, bcrypt) });

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	//let found = false;
	/*database.users.forEach(user => {
		if (user.id === id) {
			found = true;
			return res.json(user);
		} 
		
	});*/
	
	db.select('*').from('users').where('id', id).then(user => {
			if (user.length) {
				res.json(user[0]);
			} else {
				res.status(404).json('Not found');
			}
		})
		.catch(err => res.status(404).json('Error getting user'));
	
	/*if(!found) {
		res.status(404).json('not found');
	}*/
});

app.post('/imageUrl', (req, res) => {
	capp.models.predict("a403429f2ddf4b49b307e318f00e528b", req.body.image)
	.then(data => {
		//console.log(data);
		res.json(data);
	})
	.catch(err => res.status(400).json('Unable to work with API'));
});

app.put('/image', (req, res) => {
	const { id } = req.body;
	/*let found = false;
	database.users.forEach(user => {
		if (user.id === id) {
			found = true;
			user.entries++;
			return res.json(user.entries);
		} 
		
	});
	if(!found) {
		res.status(404).json('not found');
	}*/
	
	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => res.status(400).json('Unable to get entries'));
	
});

app.listen(3001, () => {
	console.log('App is running on port 3001');
});