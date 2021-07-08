#pragma once

#include <map>
#include <list>
#include <iostream>
#include "Dot.hpp"
#include "CausalContext.hpp"

class DotFun
{
private:
	std::map<Dot, int> _state;
public:
	DotFun() {}

	DotFun(std::map<Dot, int> state) : _state(state) {}

	std::list<Dot> Dots() {
		std::list<Dot> list;
		for (std::map<Dot, int>::const_iterator it = _state.begin(); it != _state.end(); ++it) {
			list.push_front(it->first);
		}
		return list;
	}

	void add(Dot d, int val) {
		_state[d] = val;
	}

	int size() {
		int c = 0;
		for (std::map<Dot, int>::const_iterator it = _state.begin(); it != _state.end(); ++it) {
			c++;
		}
		return c;
	}

	static DotFun join(DotFun f1, CausalContext c1, DotFun f2, CausalContext c2) {

		DotFun res;

		std::list<Dot> dom1 = f1.Dots();
		std::list<Dot> dom2 = f2.Dots();

		for (auto const& d : dom1) {
			if (!c2.contains(d)) {
				res._state[d] = f1._state[d];
			}
		}
		for (auto const& d : dom2) {
			if (!c1.contains(d)) {
				res._state[d] = f2._state[d];
			}
		}

		return res;
	}

	friend std::ostream& operator<<(std::ostream& os, const DotFun& d) {
		for (auto it = d._state.begin(); it != d._state.end(); ++it) {
			os << "    {" << it->first << "->" << it->second << "}";
			auto it_copy = it;
			it_copy++;
			if (it_copy != d._state.end()) {
				os << ",";
			}
			os << "\n";
		}
		return os;
	}
};

