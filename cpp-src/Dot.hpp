#pragma once

#include <iostream>

class Dot
{
private:
	int _replica;
	int _num;

public:
	Dot(int num, int replica);

	int Num() const;
	int Replica() const;

	auto operator<(const Dot& d) {
		if (_replica < d._replica) return true;
		if (_replica == d._replica && _num < d._num) return true;
		return false;
	}

	auto operator==(const Dot& d) {
		return _num == d._num && _replica == d._replica;
	}

	auto operator<=(const Dot& d) {
		return operator<(d) || operator==(d);
	}
	friend bool operator==(const Dot& lhs, const Dot& rhs) { return lhs._replica == rhs._replica && lhs._num == rhs._num; }
	friend bool operator!=(const Dot& lhs, const Dot& rhs) { return !(lhs == rhs); }
	friend bool operator< (const Dot& lhs, const Dot& rhs) { 
		if (lhs._replica < rhs._replica) return true;
		if (lhs._replica == rhs._replica && lhs._num < rhs._num) return true;
		return false;
	}
	friend bool operator> (const Dot& lhs, const Dot& rhs) { return !(lhs == rhs || lhs < rhs);  }
	friend bool operator<=(const Dot& lhs, const Dot& rhs) { return lhs == rhs || lhs < rhs; }
	friend bool operator>=(const Dot& lhs, const Dot& rhs) { return !(lhs < rhs); }

	friend std::ostream& operator<<(std::ostream& os, const Dot& d) {
		os << "(r" << d._replica << "," << d._num << ")";
		return os;
	}

};