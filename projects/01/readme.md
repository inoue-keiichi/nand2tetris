# Not

Nandの表の一部

| a | b | out |
| ---- | ---- | ---- |
| 0 | 0 | 1 |
| 1 | 1 | 0 |

Notは、 a=b ならば out=1 なのでNandに同じ値を入力する

<pre>
in-------a----Nand----out
     |         |
     ----b------
</pre>

# And
Nandの表

| a | b | out |
| ---- | ---- | ---- |
| 0 | 0 | 1 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

Andの表

| a | b | out |
| ---- | ---- | ---- |
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

表からAnd(a,b)=Not(Nand(a,b))

# Or
Nandの表

| a | b | out |
| ---- | ---- | ---- |
| 0 | 0 | 1 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

Orの表

| a | b | out |
| ---- | ---- | ---- |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

Or(0,0)=Nand(1,1)
Or(0,1)=Nand(1,0)
Or(1,0)=Nand(0,1)
なので、Or(a,b)=Nand(Not(a),Not(b))が成り立つ。

# Xor

f(a,b) = a * not(b) + not(a) * b

# Mux

f(a,b,sel) = x * not(y) * not(z) + x * y * not(z) + not(x) * y * z + x * y *z 

# DMux

| in | sel | a |
| ---- | ---- | ---- |
| 0 | 0 | 0 |
| 1 | 1 | 0 |
| 1 | 0 | 1 |
| 0 | 1 | 0 |

f(in,sel) = in * not(sel)

| in | sel | b |
| ---- | ---- | ---- |
| 0 | 0 | 0 |
| 1 | 1 | 1 |
| 1 | 0 | 0 |
| 0 | 1 | 0 |

f(in,sel) = in * sel

# Mux4Way16

<pre>
a-------Mux-------Mux-------out
     |   ^     |   ^
b----- sel[1]  | sel[0]
               |
c-------Mux-----
    |    ^
d----   sel[1]
</pre>

# DMux4Way

<pre>
in-----DMux-------DMux-------a
         ^    |     ^    |
       sel[1] |   sel[0] |
              |          ----b
              ----Dmux-------c
                   ^    |
                 sel[0] |
                         ----d
</pre>
