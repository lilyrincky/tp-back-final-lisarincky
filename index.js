import express from 'express';
import pokemon from './schema/pokemon.js';
import cors from "cors";

import './connect.js';

const app = express();
app.use(cors({}));
app.use(express.json());
app.use('/assets', express.static('assets'));

app.get('/', (req, res) => { //quand une requête GET arrive, je salue
  res.send('Hello, World!');
});

//Affichage des pokemons (exemple : "http://localhost:3000/pokemons , http://localhost:3000/pokemons?page=3 , http://localhost:3000/pokemons?page=8 et http://localhost:3000/pokemons?page=9")
app.get('/pokemons', async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1;
    const skip = (page-1)*20; //Vérifier quand on tourne la page
    const pokemons = await pokemon.find({}).skip(skip).limit(20); //pour limiter le nombre de pokemons à afficher
    const total = await pokemon.countDocuments();
    res.json({page:page,limit:20,total:total,nbPages:Math.ceil(total/20),data:pokemons});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Recherche d'un pokemon par nom (exemple : "http://localhost:3000/pokemons/search?name=Pikachu")
app.get('/pokemons/search', async (req, res) => {
  try {
    const name = req.query.name;
    if (!name) {
      return res.status(400).json({ error: 'Name query is required' });
    }

    const poke = await pokemon.findOne({'name.french': name});
    if (poke) {
      res.json(poke);
    }else{
      return res.status(404).json({ error: 'Pokemon not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Recherche d'un pokemon par id (exemple : "http://localhost:3000/pokemons/25")
app.get('/pokemons/:id', async (req, res) => {
  try {
    const pokeId = parseInt(req.params.id, 10);
    const poke = await pokemon.findOne({ id: pokeId });
    if (poke) {
      res.json(poke);
    } else {
      res.status(404).json({ error: 'Pokemon not found' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Supprimer un pokemon
app.delete('/pokemons/:id', async (req, res) => {
  try {
    const pokeId = parseInt(req.params.id, 10);
    const poke = await pokemon.findOneAndDelete({ id: pokeId });
    if (poke) {
      res.json({ message: 'Pokemon deleted successfully' });
    } else {
      res.status(404).json({ error: 'Pokemon not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Modifier un pokemon
app.put('/pokemons/:id', async (req, res) => {
  try {
    const pokeId = parseInt(req.params.id, 10);
    const poke = await pokemon.findOneAndUpdate({ id: pokeId },req.body,{ new: true, runValidators: true });
    if (poke) {
      res.json(poke);
    }else{
      return res.status(404).json({ error: 'Pokemon not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Créer un nouveau pokemon
app.post('/pokemons', async (req, res) => {
  try {
    const lastPokemon = await pokemon.findOne().sort({ id: -1 });
    const nextId = lastPokemon ? lastPokemon.id + 1 : 1;

    const newPoke = new pokemon({
      ...req.body,
      id: nextId
    });

    await newPoke.save();
    res.status(201).json(newPoke);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

console.log('Server is set up. Ready to start listening on a port.');

app.listen(3000, () => { //port d'écoute
  console.log('Server is running on http://localhost:3000');
});