import dayjs from "dayjs";

export function getEndOfDay(date: Date) {
	return dayjs(date).endOf("day").toDate();
}

export function getEndOfHour(date: Date) {
	return dayjs(date).endOf("hour").toDate();
}

export function getStartOfDay(date: Date) {
	return dayjs(date).startOf("day").toDate();
}

export function getStartOfHour(date: Date) {
	return dayjs(date).startOf("hour").toDate();
}