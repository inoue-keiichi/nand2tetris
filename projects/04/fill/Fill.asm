// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

// Put your code here.
 
@SCREEN
D=A
@0
M=D // M[0]=0x4000
(LOOP)
    @KBD
    D=M

    @ROOT1
    D; JGT
    @ROOT2
    0; JMP

    (ROOT1)
    @0
    A=M
    M=!M
    @0
    M=M+1
    @LOOP
    0; JMP

    (ROOT2)
    @0
    A=M
    @0
    M=M+1
    @LOOP
    0; JMP
