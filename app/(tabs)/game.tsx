/**
 * EmotionMatchGame.js
 * A memory card game for children with ASD to learn emotions
 * Features simple matching mechanics and positive reinforcement
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';


// ============================================================================
// Game Configuration
// ============================================================================

const EMOTIONS = [
  { id: 1, name: 'Happy', emoji: '😊', color: '#FFE5E5', sound: 'happy.mp3' },
  { id: 2, name: 'Sad', emoji: '😢', color: '#E5F0FF', sound: 'sad.mp3' },
  { id: 3, name: 'Surprised', emoji: '😲', color: '#FFF4E5', sound: 'surprised.mp3' },
  { id: 4, name: 'Angry', emoji: '😡', color: '#FFE5E5', sound: 'angry.mp3' },
  { id: 5, name: 'Sleepy', emoji: '😴', color: '#E5FFE5', sound: 'sleepy.mp3' },
  { id: 6, name: 'Excited', emoji: '🤗', color: '#F5E5FF', sound: 'excited.mp3' },
];

const LEVELS = {
  EASY: { pairs: 3, cols: 2 },
  MEDIUM: { pairs: 4, cols: 2 },
  HARD: { pairs: 6, cols: 3 },
};

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Individual card component with flip animation
 */
const Card = ({ emotion, isFlipped, isMatched, onPress, style }) => {
  const flipAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <Pressable
      style={[styles.cardContainer, style]}
      onPress={onPress}
      disabled={isFlipped || isMatched}
    >
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardFront,
          frontAnimatedStyle,
          { backgroundColor: isMatched ? '#E8F5E9' : '#FFF' },
        ]}
      >
        <Text style={styles.questionMark}>❓</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          backAnimatedStyle,
          { backgroundColor: emotion.color },
        ]}
      >
        <Text style={styles.emoji}>{emotion.emoji}</Text>
        <Text style={styles.emotionName}>{emotion.name}</Text>
      </Animated.View>
    </Pressable>
  );
};

/**
 * Level selection component
 */
const LevelSelect = ({ onSelect }) => (
  <View style={styles.levelContainer}>
    <Text style={styles.levelTitle}>Choose Your Level! 🎮</Text>
    <View style={styles.levelButtons}>
      {Object.entries(LEVELS).map(([level, config]) => (
        <Pressable
          key={level}
          style={[styles.levelButton, { backgroundColor: EMOTIONS[0].color }]}
          onPress={() => onSelect(level)}
        >
          <Text style={styles.levelButtonText}>{level}</Text>
          <Text style={styles.levelPairs}>{config.pairs} Pairs</Text>
        </Pressable>
      ))}
    </View>
  </View>
);

// ============================================================================
// Main Component
// ============================================================================

export default function EmotionMatchGame() {
  const [gameState, setGameState] = useState({
    cards: [],
    flippedIndices: [],
    matchedPairs: [],
    moves: 0,
    level: null,
  });
  const [showCelebration, setShowCelebration] = useState(false);

  // Initialize game with selected level
  const startGame = (level) => {
    const { pairs } = LEVELS[level];
    const selectedEmotions = EMOTIONS.slice(0, pairs);
    const gameCards = [...selectedEmotions, ...selectedEmotions]
      .sort(() => Math.random() - 0.5)
      .map((emotion, index) => ({
        ...emotion,
        id: `${emotion.id}-${index}`,
      }));

    setGameState({
      cards: gameCards,
      flippedIndices: [],
      matchedPairs: [],
      moves: 0,
      level,
    });
  };

  // Handle card flip
  const handleCardPress = async (index) => {
    const { cards, flippedIndices, matchedPairs } = gameState;

    // Ignore if card is already flipped or matched
    if (
      flippedIndices.includes(index) ||
      matchedPairs.includes(cards[index].id)
    ) {
      return;
    }

    // Update flipped cards
    const newFlippedIndices = [...flippedIndices, index];
    setGameState({ ...gameState, flippedIndices: newFlippedIndices });

    // Speak emotion name
    Speech.speak(cards[index].name, {
      pitch: 1.5,
      rate: 0.8,
    });

    // Check for match when two cards are flipped
    if (newFlippedIndices.length === 2) {
      const [firstIndex, secondIndex] = newFlippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.name === secondCard.name) {
        // Match found
        const newMatchedPairs = [...matchedPairs, firstCard.id, secondCard.id];
        setTimeout(() => {
          setGameState({
            ...gameState,
            matchedPairs: newMatchedPairs,
            flippedIndices: [],
            moves: gameState.moves + 1,
          });

          // Check for game completion
          if (newMatchedPairs.length === cards.length) {
            setShowCelebration(true);
            Speech.speak('Great job! You found all the matches!', {
              pitch: 1.5,
              rate: 0.8,
            });
          }
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setGameState({
            ...gameState,
            flippedIndices: [],
            moves: gameState.moves + 1,
          });
        }, 1500);
      }
    }
  };

  // Reset game
  const resetGame = () => {
    setShowCelebration(false);
    setGameState({
      cards: [],
      flippedIndices: [],
      matchedPairs: [],
      moves: 0,
      level: null,
    });
  };

  if (!gameState.level) {
    return <LevelSelect onSelect={startGame} />;
  }

  return (
    <View style={styles.container}>
      {/* Game Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Match the Emotions! 🎯</Text>
        <Text style={styles.movesText}>Moves: {gameState.moves}</Text>
      </View>

      {/* Game Grid */}
      <View
        style={[
          styles.grid,
          {
            width: '100%',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
          },
        ]}
      >
        {gameState.cards.map((card, index) => (
          <Card
            key={card.id}
            emotion={card}
            isFlipped={
              gameState.flippedIndices.includes(index) ||
              gameState.matchedPairs.includes(card.id)
            }
            isMatched={gameState.matchedPairs.includes(card.id)}
            onPress={() => handleCardPress(index)}
            style={{
              width: `${100 / LEVELS[gameState.level].cols - 5}%`,
              margin: '2.5%',
            }}
          />
        ))}
      </View>

      {/* Celebration Overlay */}
      {showCelebration && (
        <View style={styles.celebrationOverlay}>
          <Text style={styles.celebrationEmoji}>🎉 🌟 🎈</Text>
          <Text style={styles.celebrationText}>
            Amazing Job!{'\n'}You Found All the Matches!
          </Text>
          <Text style={styles.celebrationEmoji}>🎮 🌈 ⭐</Text>
          <Pressable style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainText}>Play Again! 🎮</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 10,
  },
  movesText: {
    fontSize: 20,
    color: '#666',
  },
  grid: {
    flex: 1,
    alignItems: 'center',
  },
  cardContainer: {
    aspectRatio: 0.7,
    perspective: 1000,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardFront: {
    backgroundColor: '#FFF',
  },
  cardBack: {
    backgroundColor: '#FFF',
  },
  questionMark: {
    fontSize: 40,
    color: '#666',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emotionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  levelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    padding: 20,
  },
  levelTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 30,
    textAlign: 'center',
  },
  levelButtons: {
    width: '100%',
  },
  levelButton: {
    backgroundColor: '#FFE5E5',
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  levelButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  levelPairs: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 48,
    marginVertical: 10,
    textAlign: 'center',
  },
  celebrationText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A4A4A',
    textAlign: 'center',
    marginVertical: 20,
  },
  playAgainButton: {
    backgroundColor: '#FFB6C1',
    padding: 20,
    borderRadius: 25,
    marginTop: 20,
  },
  playAgainText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
});