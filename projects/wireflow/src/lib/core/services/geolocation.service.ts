import { Injectable } from '@angular/core';

@Injectable()
export class GeolocationService {

    getCurrentPosition() {
        return new Promise<number[]>((resolve, reject) => {
            if (!navigator.geolocation) {
                resolve();
            }
            navigator.geolocation.getCurrentPosition(
                position => resolve(position && position.coords && [position.coords.latitude, position.coords.longitude]),
                error => {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            return reject('Failed to determine location: Denied the request for Geolocation. Maybe, ask the user in a more polite way?');
                        case error.POSITION_UNAVAILABLE:
                            return reject('Failed to determine location: Location information is unavailable.');
                        case error.TIMEOUT:
                            return reject('Failed to determine location: The request to get location timed out.');
                        default:
                            return reject(`Failed to determine location: ${error.message}`);
                    }
                },
                {
                    // should the device take extra time or power to return a really accurate result, or should it give you the quick (but less accurate) answer?
                    enableHighAccuracy: false,
                    // how long does the device have, in milliseconds to return a result?
                    timeout: 5000,
                    // maximum age for a possible previously-cached position. 0 = must return the current position, not a prior cached position
                    maximumAge: 0
                });
        });
    }
}