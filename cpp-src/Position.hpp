#pragma once

#include <utility>      // std::pair, std::make_pair
#include <list>
#include <map>
#include <iostream>
#include "CompDotFun.hpp"
#include "CausalContext.hpp"

class Position
{
private:
	CompDotFun state;
	CausalContext cc;
	int _r;

public:

	Position() : _r(0) {}

	Position(int replicaId) : _r(replicaId) {}

	Position(const Position& p) : _r(p._r) {
		state = CompDotFun(p.state);
		cc = CausalContext(p.cc);
	}


	std::pair<CompDotFun, CausalContext> move(int p) {
		std::list<Dot> roots = state.GetRoots();
		Dot d = cc.next(_r);
		std::map<Dot, DotFun> s;
		for (auto r : roots) {
			std::map<Dot, int> f = { {d , p} };
			s[r] = f;
		}


		std::list<Dot> children = state.GetChildren();
		children.push_back(d);

		CausalContext deltaCC(children);
		CompDotFun deltaState(s);

		return std::make_pair(deltaState, deltaCC);
	}

	int size() {
		return state.size();
	}

	std::pair<CompDotFun, CausalContext> apply(int p) {
		std::list<Dot> roots = state.GetRoots();
		Dot d = cc.next(_r);
		std::map<Dot, DotFun> s;
		std::map<Dot, int> f = { {d , p} };
		s[d] = f;

		roots.push_back(d);

		CausalContext deltaCC(roots);
		CompDotFun deltaState(s);

		return std::make_pair(deltaState, deltaCC);
	}

	void merge(std::pair<CompDotFun, CausalContext> delta) {
		state = CompDotFun::join(state, cc, delta.first, delta.second);
		cc.merge(delta.second);
	}

	friend std::ostream& operator<<(std::ostream& os, const Position& d) {
		os << d.state;
		return os;
	}
};

