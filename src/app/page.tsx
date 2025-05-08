'use client';

import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SkipForward, Flag, UserCircle } from 'lucide-react'; // Removed MessageCircleWarning
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

type Player = 'black' | 'white';
type Board = (Player | null)[][];
const BOARD_SIZE = 19;

const createEmptyBoard = (): Board => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

// const getBoardString = (board: Board): string => {
//   return board.map(row => 
//     row.map(cell => cell === 'black' ? 'B' : cell === 'white' ? 'W' : '.').join('')
//   ).join('\n');
// };

const getMoveString = (row: number, col: number): string => {
  const letters = "ABCDEFGHJKLMNOPQRST"; // Standard Go coordinates, skipping 'I'
  return `${letters[col]}${BOARD_SIZE - row}`;
};

const Home: NextPage = () => {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  // const [isThinking, setIsThinking] = useState(false); // Removed AI thinking state
  // const [error, setError] = useState<string | null>(null); // Removed AI error state
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [clientOnly, setClientOnly] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setClientOnly(true);
  }, []);

  const handleCellClick = async (rowIndex: number, colIndex: number) => {
    if (gameOver || board[rowIndex][colIndex] !== null) { // Removed isThinking
      return;
    }

    // No AI validation, just place the stone
    const newBoard = board.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (rIdx === rowIndex && cIdx === colIndex) {
          return currentPlayer;
        }
        return cell;
      })
    );
    setBoard(newBoard);
    
    // Basic win condition (filling the board - this is a simplification for demo)
    // This should be replaced with actual Go scoring logic in a real game.
    let isBoardFull = true;
    let blackStones = 0;
    let whiteStones = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (newBoard[r][c] === null) {
          isBoardFull = false;
        } else if (newBoard[r][c] === 'black') {
          blackStones++;
        } else if (newBoard[r][c] === 'white') {
          whiteStones++;
        }
      }
    }

    if (isBoardFull) { // Simplified win condition
      setGameOver(true);
      const gameWinner = blackStones > whiteStones ? 'black' : whiteStones > blackStones ? 'white' : null; // Could be a draw
      if (gameWinner) {
        setWinner(gameWinner);
        toast({
            title: "Game Over!",
            description: `${gameWinner.charAt(0).toUpperCase() + gameWinner.slice(1)} wins by filling the board!`,
        });
      } else {
         toast({
            title: "Game Over!",
            description: "It's a draw by filling the board!",
        });
      }
    } else {
      setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
    }
  };

  const handlePass = () => {
    if (gameOver) return; // Removed isThinking
    // In a real Go game, two consecutive passes end the game.
    // This is a simplified implementation.
    setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
    toast({
      title: "Pass",
      description: `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} passed their turn.`,
    });
  };
  
  const handleResign = () => {
    if (gameOver) return; // Removed isThinking
    setGameOver(true);
    const resignee = currentPlayer;
    const winnerPlayer = resignee === 'black' ? 'white' : 'black';
    setWinner(winnerPlayer);
    toast({
      title: "Game Over",
      description: `${resignee.charAt(0).toUpperCase() + resignee.slice(1)} resigned. ${winnerPlayer.charAt(0).toUpperCase() + winnerPlayer.slice(1)} wins!`,
    });
  };

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('black');
    // setError(null); // Removed error state
    setGameOver(false);
    setWinner(null);
    // setIsThinking(false); // Removed thinking state
    toast({
      title: "Game Reset",
      description: "The board has been reset. Black to play.",
    });
  };


  if (!clientOnly) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Toaster />
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-primary">Go Dojo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-6">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <UserCircle className={`w-8 h-8 ${currentPlayer === 'black' ? 'text-foreground' : 'text-muted-foreground'}`} />
              <span className={`text-xl font-semibold ${currentPlayer === 'black' ? 'text-foreground' : 'text-muted-foreground'}`}>
                {currentPlayer === 'black' ? 'Black' : 'White'} to Play
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handlePass} disabled={gameOver} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <SkipForward className="mr-2 h-5 w-5" /> Pass
              </Button>
              <Button variant="destructive" onClick={handleResign} disabled={gameOver}>
                <Flag className="mr-2 h-5 w-5" /> Resign
              </Button>
            </div>
          </div>

          {/* Removed AI error display Alert */}

          {gameOver && winner && (
            <Alert variant="default" className="mb-6 bg-primary text-primary-foreground">
              <Flag className="h-4 w-4 text-primary-foreground" />
              <AlertTitle className="text-primary-foreground">Game Over!</AlertTitle>
              <AlertDescription className="text-primary-foreground">
                {winner.charAt(0).toUpperCase() + winner.slice(1)} wins!
              </AlertDescription>
            </Alert>
          )}
          
          <div 
            className="grid gap-0.5 bg-secondary p-2 rounded-md shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              aspectRatio: '1 / 1',
              maxWidth: '700px', // Max width for the board itself
              margin: '0 auto', // Center the board
            }}
            aria-label="Go Board"
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="relative aspect-square bg-secondary flex items-center justify-center cursor-pointer group"
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCellClick(rowIndex, colIndex)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Board cell ${getMoveString(rowIndex, colIndex)}. ${cell ? cell + ' stone' : 'Empty'}`}
                >
                  {/* Grid lines */}
                  {/* Horizontal line */}
                  <div className="absolute top-1/2 left-0 w-full h-px bg-primary/30 transform -translate-y-1/2"></div>
                  {/* Vertical line */}
                  <div className="absolute left-1/2 top-0 h-full w-px bg-primary/30 transform -translate-x-1/2"></div>
                  
                  {/* Star points (Hoshi) - for a standard 19x19 board */}
                  {((rowIndex === 3 || rowIndex === 9 || rowIndex === 15) &&
                    (colIndex === 3 || colIndex === 9 || colIndex === 15)) && (
                    <div className="absolute w-1.5 h-1.5 bg-primary/50 rounded-full"></div>
                  )}

                  {cell && (
                    <div
                      className={`absolute w-5/6 h-5/6 rounded-full shadow-md transition-transform duration-150 ease-out transform group-hover:scale-105 ${
                        cell === 'black' ? 'bg-foreground' : 'bg-background border-2 border-neutral-400'
                      }`}
                      style={{ animation: 'placeStone 0.2s ease-out' }}
                      aria-hidden="true"
                    ></div>
                  )}
                  {!cell && !gameOver && (
                     <div
                        className={`absolute w-5/6 h-5/6 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-150 ease-out ${
                          currentPlayer === 'black' ? 'bg-foreground' : 'bg-background border-2 border-neutral-400'
                        }`}
                        aria-hidden="true"
                      ></div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
           <Button onClick={handleReset} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            Reset Game
          </Button>
        </CardFooter>
      </Card>
      <style jsx global>{`
        @keyframes placeStone {
          0% { transform: scale(0.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Home;
