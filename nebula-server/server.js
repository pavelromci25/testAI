const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Загружаем переменные окружения
dotenv.config();

// Создаем Express приложение
const app = express();

// Middleware
app.use(cors({
  origin: ['https://pavelromci25.github.io', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Схема пользователя
const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  username: String,
  firstName: String,
  lastName: String,
  photoUrl: String,
  coins: {
    type: Number,
    default: 0
  },
  stars: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  referrals: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Схема игры
const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['tma', 'webview'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: String,
  imageUrl: String,
  category: String,
  isActive: {
    type: Boolean,
    default: true
  }
});

// Создаем модели
const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);

// Маршруты API
app.get('/api/games', async (req, res) => {
  try {
    let games = await Game.find({ isActive: true });
    
    if (games.length === 0) {
      // Если игр нет, добавляем тестовые данные
      const defaultGames = [
        {
          gameId: "1",
          name: "Space Adventure",
          type: "webview",
          url: "https://vketgames.com/games/1000",
          isActive: true
        },
        {
          gameId: "2",
          name: "Crypto Clicker",
          type: "tma",
          url: "https://tma.dev/crypto-clicker",
          isActive: true
        },
        {
          gameId: "3",
          name: "Tower Defense",
          type: "webview",
          url: "https://vketgames.com/games/2000",
          isActive: true
        }
      ];
      
      await Game.insertMany(defaultGames);
      games = await Game.find({ isActive: true });
    }
    
    res.json(games.map(game => ({
      id: game.gameId,
      name: game.name,
      type: game.type,
      url: game.url,
      imageUrl: game.imageUrl,
      description: game.description
    })));
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let user = await User.findOne({ telegramId: id });
    
    if (!user) {
      // Создаем пользователя, если он не существует
      user = new User({
        telegramId: id,
        username: id === 'guest' ? 'Guest' : 'Unknown',
        coins: id === 'guest' ? 50 : 0,
        stars: id === 'guest' ? 5 : 0,
        lastActive: new Date(),
        referrals: []
      });
      await user.save();
    }
    
    // Обновляем время последней активности
    user.lastActive = new Date();
    await user.save();
    
    res.json({
      id: user.telegramId,
      username: user.username || user.firstName || 'Unknown',
      coins: user.coins,
      stars: user.stars,
      referrals: user.referrals.map(refId => ({ 
        telegramId: refId, 
        username: 'Referral' 
      })),
      photoUrl: user.photoUrl,
      firstName: user.firstName,
      lastName: user.lastName
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/user/update', async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName, photoUrl } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }
    
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      user = new User({
        telegramId,
        username,
        firstName,
        lastName,
        photoUrl,
        coins: 0,
        stars: 0,
        lastActive: new Date(),
        referrals: []
      });
    } else {
      if (username) user.username = username;
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (photoUrl) user.photoUrl = photoUrl;
      user.lastActive = new Date();
    }
    
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        coins: user.coins,
        stars: user.stars
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/coins', async (req, res) => {
  try {
    const { userId, coins = 1 } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    let user = await User.findOne({ telegramId: userId });
    
    if (!user) {
      user = new User({
        telegramId: userId,
        username: userId === 'guest' ? 'Guest' : 'Unknown',
        coins: 0,
        stars: 0,
        lastActive: new Date(),
        referrals: []
      });
    }
    
    user.coins += coins;
    user.lastActive = new Date();
    await user.save();
    
    res.json({ success: true, coins: user.coins });
  } catch (error) {
    console.error('Error adding coins:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/referral', async (req, res) => {
  try {
    const { userId, referrerId, username = 'Unknown' } = req.body;
    
    if (!userId || !referrerId) {
      return res.status(400).json({ error: 'User ID and Referrer ID are required' });
    }
    
    if (userId === referrerId) {
      return res.status(400).json({ error: 'User cannot refer themselves' });
    }
    
    let referrer = await User.findOne({ telegramId: referrerId });
    
    if (!referrer) {
      referrer = new User({
        telegramId: referrerId,
        username: referrerId === 'guest' ? 'Guest' : 'Unknown',
        coins: 0,
        stars: 0,
        lastActive: new Date(),
        referrals: []
      });
    }
    
    // Проверяем, что реферал не был добавлен ранее
    if (!referrer.referrals.includes(userId)) {
      referrer.referrals.push(userId);
      referrer.stars += 2;
      referrer.coins += 10;
      referrer.lastActive = new Date();
      await referrer.save();
      
      res.json({
        success: true,
        message: 'Referral added successfully',
        stars: referrer.stars,
        coins: referrer.coins
      });
    } else {
      res.json({
        success: false,
        message: 'User is already referred',
        stars: referrer.stars,
        coins: referrer.coins
      });
    }
  } catch (error) {
    console.error('Error adding referral:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Проверка работоспособности
app.get('/', (req, res) => {
  res.json({ message: 'Nebula API is running' });
});

// Подключение к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Запуск сервера
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });