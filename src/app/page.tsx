
'use client';

import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SkipForward, Flag, UserCircle } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

type Player = 'black' | 'white';
type Board = (Player | null)[][];
const BOARD_SIZE = 19;

const createEmptyBoard = (): Board => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

const getMoveString = (row: number, col: number): string => {
  const letters = "ABCDEFGHJKLMNOPQRST"; // Standard Go coordinates, skipping 'I'
  return `${letters[col]}${BOARD_SIZE - row}`;
};

const Home: NextPage = () => {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [clientOnly, setClientOnly] = useState(false);
  const [blackScore, setBlackScore] = useState(0);
  const [whiteScore, setWhiteScore] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    setClientOnly(true);
  }, []);

  const getGroup = (
    targetBoard: Board,
    r: number,
    c: number
  ): { stones: Set<string>; liberties: Set<string> } => {
    const player = targetBoard[r]?.[c];
    if (!player) {
      return { stones: new Set(), liberties: new Set() };
    }

    const stones = new Set<string>();
    const liberties = new Set<string>();
    const q: [number, number][] = [[r, c]];
    const visitedThisSearch = new Set<string>(); // Visited for current BFS/DFS path

    while (q.length > 0) {
      const [currR, currC] = q.shift()!;
      const posKey = `${currR},${currC}`;

      if (visitedThisSearch.has(posKey)) continue;
      visitedThisSearch.add(posKey);
      
      // Check if the current cell is on the board and belongs to the player
      if (
        currR >= 0 && currR < BOARD_SIZE &&
        currC >= 0 && currC < BOARD_SIZE &&
        targetBoard[currR][currC] === player
      ) {
        stones.add(posKey);
        const neighbors = [
          [currR - 1, currC], [currR + 1, currC],
          [currR, currC - 1], [currR, currC + 1],
        ];

        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            const neighborKey = `${nr},${nc}`;
            if (targetBoard[nr][nc] === null) {
              liberties.add(neighborKey);
            } else if (targetBoard[nr][nc] === player && !visitedThisSearch.has(neighborKey)) {
              q.push([nr, nc]);
            }
          }
        }
      }
    }
    return { stones, liberties };
  };

  const handleCellClick = async (rowIndex: number, colIndex: number) => {
    if (gameOver || board[rowIndex][colIndex] !== null) {
      return;
    }

    let tempBoard = board.map(row => [...row]);
    tempBoard[rowIndex][colIndex] = currentPlayer;

    let capturedStonesThisTurn = 0;
    const opponent = currentPlayer === 'black' ? 'white' : 'black';

    // Check neighbors for captures of opponent stones
    const neighbors = [
      [rowIndex - 1, colIndex], [rowIndex + 1, colIndex],
      [rowIndex, colIndex - 1], [rowIndex, colIndex + 1],
    ];

    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && tempBoard[nr]?.[nc] === opponent) {
        const { stones: groupStones, liberties: groupLiberties } = getGroup(tempBoard, nr, nc);
        if (groupLiberties.size === 0) {
          for (const stonePos of groupStones) {
            const [sr, sc] = stonePos.split(',').map(Number);
            if (tempBoard[sr][sc] === opponent) { // Ensure it's still an opponent stone (could be captured by another part of a larger move)
                 tempBoard[sr][sc] = null;
                 capturedStonesThisTurn++;
            }
          }
        }
      }
    }

    // Check for self-capture (suicide)
    const { liberties: myGroupLiberties } = getGroup(tempBoard, rowIndex, colIndex);
    if (myGroupLiberties.size === 0 && capturedStonesThisTurn === 0) {
      toast({
        title: "Invalid Move",
        description: "Self-capture (suicide) is not allowed if it doesn't capture opponent stones.",
        variant: "destructive",
      });
      return; // Invalid move, revert or don't apply
    }

    // Move is valid, update board and scores
    setBoard(tempBoard);
    if (currentPlayer === 'black') {
      setBlackScore(prev => prev + capturedStonesThisTurn);
    } else {
      setWhiteScore(prev => prev + capturedStonesThisTurn);
    }

    if (capturedStonesThisTurn > 0) {
      toast({
        title: "Capture!",
        description: `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} captured ${capturedStonesThisTurn} stone(s).`,
      });
    }
    
    // Simplified win condition (filling the board) - can be expanded later
    let isBoardFull = true;
    let blackStonesCount = 0;
    let whiteStonesCount = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (tempBoard[r][c] === null) {
          isBoardFull = false;
        } else if (tempBoard[r][c] === 'black') {
          blackStonesCount++;
        } else if (tempBoard[r][c] === 'white') {
          whiteStonesCount++;
        }
      }
    }

    if (isBoardFull) {
      setGameOver(true);
      // Final scoring might include territory, but here it's just stone count + captures
      const finalBlackScore = blackStonesCount + blackScore;
      const finalWhiteScore = whiteStonesCount + whiteScore;
      const gameWinner = finalBlackScore > finalWhiteScore ? 'black' : finalWhiteScore > finalBlackScore ? 'white' : null;
      
      if (gameWinner) {
        setWinner(gameWinner);
        toast({
            title: "Game Over!",
            description: `${gameWinner.charAt(0).toUpperCase() + gameWinner.slice(1)} wins by filling the board! Final Score: Black ${finalBlackScore}, White ${finalWhiteScore}`,
        });
      } else {
         toast({
            title: "Game Over!",
            description: `It's a draw by filling the board! Final Score: Black ${finalBlackScore}, White ${finalWhiteScore}`,
        });
      }
    } else {
      setCurrentPlayer(opponent);
    }
  };

  const handlePass = () => {
    if (gameOver) return;
    setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
    toast({
      title: "Pass",
      description: `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} passed their turn. It is now ${currentPlayer === 'black' ? 'White' : 'Black'}'s turn.`,
    });
    // Note: Two consecutive passes usually end the game in Go. This simplified logic doesn't implement that.
  };
  
  const handleResign = () => {
    if (gameOver) return;
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
    setGameOver(false);
    setWinner(null);
    setBlackScore(0);
    setWhiteScore(0);
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
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-4">
            <div className="flex items-center space-x-2 mb-2 md:mb-0">
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

          <div className="flex justify-around mb-6 text-lg">
            <div>Black Captures: <span className="font-bold">{blackScore}</span></div>
            <div>White Captures: <span className="font-bold">{whiteScore}</span></div>
          </div>

          {gameOver && winner && (
            <Alert variant="default" className="mb-6 bg-primary text-primary-foreground">
              <Flag className="h-4 w-4 text-primary-foreground" />
              <AlertTitle className="text-primary-foreground">Game Over!</AlertTitle>
              <AlertDescription className="text-primary-foreground">
                {winner.charAt(0).toUpperCase() + winner.slice(1)} wins!
                (Black: {blackScore + board.flat().filter(s => s === 'black').length}, White: {whiteScore + board.flat().filter(s => s === 'white').length})
              </AlertDescription>
            </Alert>
          )}
           {gameOver && !winner && ( // Draw condition based on simplified board full
            <Alert variant="default" className="mb-6 bg-primary text-primary-foreground">
              <Flag className="h-4 w-4 text-primary-foreground" />
              <AlertTitle>Game Over!</AlertTitle>
              <AlertDescription>
                It's a draw! 
                (Black: {blackScore + board.flat().filter(s => s === 'black').length}, White: {whiteScore + board.flat().filter(s => s === 'white').length})
              </AlertDescription>
            </Alert>
          )}
          
          <div 
            className="grid gap-0.5 bg-secondary p-2 rounded-md shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              aspectRatio: '1 / 1',
              maxWidth: '700px', 
              margin: '0 auto', 
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
                  tabIndex={gameOver || board[rowIndex][colIndex] !== null ? -1 : 0}
                  aria-label={`Board cell ${getMoveString(rowIndex, colIndex)}. ${cell ? cell + ' stone' : 'Empty'}. Click to place a ${currentPlayer} stone.`}
                  aria-disabled={gameOver || board[rowIndex][colIndex] !== null}
                >
                  <div className="absolute top-1/2 left-0 w-full h-px bg-primary/30 transform -translate-y-1/2"></div>
                  <div className="absolute left-1/2 top-0 h-full w-px bg-primary/30 transform -translate-x-1/2"></div>
                  
                  {((rowIndex === 3 || rowIndex === 9 || rowIndex === 15) &&
                    (colIndex === 3 || colIndex === 9 || colIndex === 15)) && (
                    <div className="absolute w-1.5 h-1.5 bg-primary/50 rounded-full"></div>
                  )}

                  {cell && (
                    <div
                      className={`absolute w-5/6 h-5/6 rounded-full shadow-md transition-transform duration-150 ease-out ${
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
