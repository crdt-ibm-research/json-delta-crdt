#pragma once

#include <mutex>          // std::mutex
#include <list>
#include <utility>

#include "CompDotFun.hpp"
#include "CausalContext.hpp"
#include "Position.hpp"
#include "CausalContext.hpp"
#include "HelperFunctions.hpp"

class Replica
{
private:
	int _r;
	std::vector<Position> _pos;
	int _counter;
	int _size;
public:
	std::mutex mtx;
	std::list<DELTA_POS> msgs;

	Replica(int r, int size) : _r(r), _counter(0), _size(size) {
		for (int i = 0; i < size; i++) {
			_pos.push_back(Position(r));
		}
	}
	Replica(const Replica & r) : _r(r._r), _pos(r._pos), _counter(0), _size(r._size) { }


	void try_handle_all() {
		_counter++;
		if (_counter > 10) {
			handle_all();
			_counter = 0;
			return;
		}
		if (!mtx.try_lock()) {
			return;
		}
		while (!msgs.empty()) {
			DELTA_POS msg = msgs.front();
			DELTA d = msg.first;
			int idx = msg.second;
			_pos[idx].merge(d);
			msgs.pop_front();
		}
		mtx.unlock();
	}

	int size() {
		int c = 0;
		for (auto p : _pos) {
			c += p.size();
		}
		return c;
	}

	void handle_all() {
		mtx.lock();
		while (!msgs.empty()) {
			DELTA_POS msg = msgs.front();
			DELTA d = msg.first;
			int idx = msg.second;
			_pos[idx].merge(d);
			msgs.pop_front();
		}
		mtx.unlock();
	}

	DELTA_POS move(int p, int idx) {
		DELTA d = _pos[idx].move(p);
		_pos[idx].merge(d);
		return std::make_pair(d, idx);
	}

	DELTA_POS apply(int p, int idx) {
		DELTA d = _pos[idx].apply(p);
		_pos[idx].merge(d);
		return std::make_pair(d, idx);
	}

	friend std::ostream& operator<<(std::ostream& os, const Replica& r) {
		os << "Replica " << r._r << ":\n";
		for (int i = 0; i < r._size; i++)
		{
			os << "arr[i]:" << r._pos[i] << "\n";
		}
		return os;
	}
};

