// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Mult.asm

// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)
//
// This program only needs to handle arguments that satisfy
// R0 >= 0, R1 >= 0, and R0*R1 < 32768.

// Put your code here.

// Computes R2=R0*R1
@i // i=0
M=0
@R2 // R2=0
M=0
@R1 // R1代入
D=M
(LOOP)
@i // if (i-R1)>=0 goto END
D=M
@R1
D=D-M
@END
D;JGE
@R0 // sum+=R0
D=M
@R2
M=D+M
@i // i++
M=M+1
@LOOP // goto LOOP
0;JMP
(END) // infinite loop
@END
0;JMP
