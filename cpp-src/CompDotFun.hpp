#pragma once

#include <map>
#include "DotFun.hpp"
#include "HelperFunctions.hpp"

class CompDotFun
{
private:
	std::map<Dot, DotFun> _state;
public:
	CompDotFun() {}

	CompDotFun(std::map<Dot, DotFun> state) : _state(state) {}

	CompDotFun(const CompDotFun& cdf) : _state(cdf._state) {}



	std::list<Dot> Dots() {
		std::list<Dot> list;
		for (std::map<Dot, DotFun>::const_iterator it = _state.begin(); it != _state.end(); ++it) {
			Dot d = it->first;
			list.push_front(d);
			std::list<Dot> d_dots  = _state[d].Dots();
			list.insert(list.end(), d_dots.begin(), d_dots.end());
		}
		return list;
	}

	int size() {
		int c = 0;
		for (std::map<Dot, DotFun>::const_iterator it = _state.begin(); it != _state.end(); ++it) {
			Dot d = it->first;
			c++;
			c += _state[d].size();
		}
		return c;
	}

	std::list<Dot> GetRoots() {
		std::list<Dot> list;
		for (std::map<Dot, DotFun>::const_iterator it = _state.begin(); it != _state.end(); ++it) {
			Dot d = it->first;
			list.push_front(d);
		}
		return list;
	}

	std::list<Dot> GetChildren() {
		std::list<Dot> list;
		for (std::map<Dot, DotFun>::const_iterator it = _state.begin(); it != _state.end(); ++it) {
			Dot d = it->first;
			std::list<Dot> d_dots = _state[d].Dots();
			list.insert(list.end(), d_dots.begin(), d_dots.end());
		}
		return list;
	}

	DotFun getDotFun(Dot r) {
		return _state[r];
	}

	static CompDotFun join(CompDotFun f1, CausalContext c1, CompDotFun f2, CausalContext c2) {
		CompDotFun res;

		std::list<Dot> dom1 = get_domain(f1._state);
		std::list<Dot> dom2 = get_domain(f2._state);

		for (auto const& d : dom1) {
			if (!c2.contains(d)) {
				res._state[d] = f1._state[d];
			}
			else if (list_contains(dom2, d)) {
				res._state[d] = DotFun::join(f1._state[d], c1, f2._state[d], c2);
			}
		}
		for (auto const& d : dom2) {
			if (!c1.contains(d)) {
				res._state[d] = f2._state[d];
			}
			else if (list_contains(dom1, d)) {
				res._state[d] = DotFun::join(f1._state[d], c1, f2._state[d], c2);
			}
		}
		return res;
	}
	friend std::ostream& operator<<(std::ostream& os, const CompDotFun& compDotFun) {
		os << "{\n";
		for (auto d : compDotFun._state) {
			os << "  {" << d.first << "-> \n" << d.second;
			os << "  },\n";
		}
		os << "}";
		return os;
	}
};
