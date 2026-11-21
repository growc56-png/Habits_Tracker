def to3(n):
    s = ''
    while n:
        s = str(n % 3) + s
        n //= 3
    return s or '0'
for N in range(1, 1000):
    r = to3(N)
    if N % 3 == 0:
        r += r[-2:]
    else:
        r += to3((N % 3) * 5)
    R = int(r, 3)
    if R >= 228:
        print(N)
        break

print(to3(11))