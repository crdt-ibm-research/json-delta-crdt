This folder contains the code for testing average number of dots needed to represent a position.

To compile it run:
```
make
```

The command line is:
```
./main <#threads> <Move probability> <Delta time for collecting stats> <Total test time> <Array size>
```

Figure 15 is created using the following command:
```
./main 32 <p> 200 2000 10
```

Figure 16 is created using the following command:
```
./main 32 0.5 200 2000 <size>
```

The output is the total and average number of dots used to represnt the positions in the array.