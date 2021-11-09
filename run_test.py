#!/bin/python3

import argparse
import os.path
import subprocess
from matplotlib import pyplot as plt
import numpy as np
BENCHMARKS = {
'3a' : 'map_updates.js',
'3b' : 'map_update_delete.js',
'3c' : 'array_update_index.js',
'3d' : 'array_update_delete_char.js',
'3e' : 'array_update_delete_map.js',
'3f' : 'array_update_delete_array.js',
'4' : 'array_worst_case.js',
'5' : 'array_random_sort_update.js'
}

MOCHA = os.path.join('node_modules', 'mocha', 'bin','mocha')

parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('-fig', '--figure',choices=BENCHMARKS.keys(), help='Recreate figure', required=True)
parser.add_argument('--mocha', help='Node mocha directory', required=False)

args = parser.parse_args()
if (args.mocha):
    MOCHA = args.mocha

benchmark = os.path.join('benchmarks', BENCHMARKS[args.figure])

def plot_figure_3x(split_lines):
    sizes = [int(x) for [x,_,_,_] in split_lines]
    dson = [np.log2(int(x)) for [_,x,_,_] in split_lines]
    automerge = [np.log2(int(x)) for [_,_,x,_] in split_lines]
    yjs = [np.log2(int(x)) for [_,_,_,x] in split_lines]
    plt.plot(sizes,dson, label="DSON")
    plt.plot(sizes,automerge, label="Automerge")
    plt.plot(sizes,yjs, label="Yjs")
    plt.legend()
    plt.xscale('log')
    plt.yscale('log')
    plt.show()

def plot_figure_4(split_lines):
    sizes = [int(x) for [x,_] in split_lines]
    dson = [int(x) for [_,x] in split_lines]
    plt.plot(sizes,dson, label="DSON")
    plt.legend()
    plt.show()

def plot_figure_5(split_lines):
   probs = [f"{line[0]},{line[1]}" for line in split_lines]
   sizes = [sum([int(size) for size in line[2:]])/ len(line[2:]) for line in split_lines]
   max_size = [4100 for _ in probs]
   min_size = [700 for _ in probs]
   plt.bar(probs, sizes)
   plt.plot(probs, max_size, 'r')
   plt.plot(probs, min_size, 'r')
   plt.show()
   
   
if __name__ == '__main__':
  process = ['node', MOCHA, benchmark]
  out = subprocess.check_output(process).decode("utf-8")
  lines = [l for l in out.split('\n') if ',' in l]
  split_lines = [l.split(',') for l in lines]
  if args.figure == '4':
    plot_figure_4(split_lines)
  elif args.figure == '5':
    plot_figure_5(split_lines)
  else:
  print("\n".join(lines))