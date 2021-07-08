#pragma once

#include <list>
#include <map>
#include <algorithm>    // std::max
#include <iostream>
#include "HelperFunctions.hpp"
#include "Dot.hpp"

class CausalContext
{
	std::map<int, int> _c;
	std::list<Dot> _dots;

public:
	CausalContext() {}

	CausalContext(std::list<Dot> dots) : _dots(dots) {}

	Dot next(int r) {
		int max = -1;
		for (auto d : _dots) {
			if (d.Replica() == r) {
				max = std::max(max, d.Num());
			}
		}
		return Dot(max+1, r);
	}

	Dot next_and_inc(int r) {
		int max = -1;
		for (auto d : _dots) {
			if (d.Replica() == r) {
				max = std::max(max, d.Num());
			}
		}
		Dot d(max+1, r);
		_dots.push_back(d);
		return d;
	}

	bool contains(Dot d) {
		for (auto _d : _dots) {
			if (_d == d) {
				return true;
			}
		}
		return false;
	}

	void merge(CausalContext cc) {
		_dots.insert(_dots.begin(), cc._dots.begin(), cc._dots.end());
		_dots.sort();
		_dots.unique();
	}

	void printCC() {
		std::cout << "{" << '\n';
		for (auto d : _dots) {
			std::cout << "(" << d.Replica() << "," << d.Num() << ")\n";
		}
		std::cout << "}" << '\n';
	}

	static CausalContext merge(CausalContext c1, CausalContext c2) {
		std::list<Dot> tmp(c1._dots);
		tmp.insert(tmp.begin(), c2._dots.begin(), c2._dots.end());
		tmp.sort();
		tmp.unique();
		return CausalContext(tmp);
	}
};

