export function GMapCircle(lat, lng, rad, detail= 8) {
  let staticMapSrc = '';

  const pi   = Math.PI;

  for (let i = 0; i <= 360; i += detail) {
    const brng = i * pi / 180;

    const { pLat, pLng } = calculateCoordinatesOnCircle(lat, lng, rad, brng);

    staticMapSrc += "|" + pLat + "," + pLng;
  }

  return encodeURI(staticMapSrc);
}

function calculateCoordinatesOnCircle(latCenter, lngCenter, radius, brng) {
  const r    = 6371;
  const pi   = Math.PI;

  const _lat  = (latCenter * pi) / 180;
  const _lng  = (lngCenter * pi) / 180;
  const d    = (radius / 1000) / r;

  let pLat = Math.asin(Math.sin(_lat) * Math.cos(d) + Math.cos(_lat) * Math.sin(d) * Math.cos(brng));
  const pLng = ((_lng + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(_lat), Math.cos(d) - Math.sin(_lat) * Math.sin(pLat))) * 180) / pi;
  pLat = (pLat * 180) / pi;

  return { pLat, pLng };
}


export function getStaticMapWithCircle(lat, lng, radius, accessKey) {
  // lat & lng are center of circle

  const mapCentLat = lat;
  const mapCentLng = lng;
  const mapW = 250;
  const mapH = 250;

  const circleRadius = radius; // Radius in meters
  const circleRadiusThick =  3;
  const circleFill =  '33a3d7';
  const circleFillOpacity =  '30';

  const smallCenterCircleFill = 'd80e7b';

  const mainMarkerColor = 'd3107f';

  const mainMarker = encodeURI('markers=color:0x' + mainMarkerColor + '|' + lat + ',' + lng);

  const endC = calculateCoordinatesOnCircle(lat, lng, radius, 90 * Math.PI / 180);

  const radiusLine = drawRadius({ lat, lng }, { lat: endC.pLat, lng: endC.pLng });

  const encString = GMapCircle(lat, lng, circleRadius);
  const smallCircleInCenter = GMapCircle(lat, lng, radius / 100);
  const biggerCircleOnTheRightSide = GMapCircle(endC.pLat, endC.pLng, radius / 15);

  let src =  'https://maps.googleapis.com/maps/api/staticmap?';
  src += 'key=' + accessKey + '&';
  src += 'center=' + mapCentLat + ',' + mapCentLng + '&';
  src += 'size=' + mapW + 'x' + mapH + '&';
  src += 'maptype=roadmap&';
  src += mainMarker + '&';
  src += radiusLine + '&';
  src += 'path=';
  src += 'fillcolor:0x' + circleFill + circleFillOpacity + '|';
  src += 'color:0x' + circleFill + 'ff|';
  src += 'weight:' + circleRadiusThick + '';
  src += '' + encString;
  src += '&path=';
  src += 'fillcolor:0x' + smallCenterCircleFill + 'ff|';
  src += 'color:0x' + smallCenterCircleFill + 'ff|';
  src += 'weight:' + 5 + '';
  src += '' + smallCircleInCenter;
  src += '&path=';
  src += 'fillcolor:0x' + circleFill + 'ff' + '|';
  src += 'color:0x' + circleFill + 'ff|';
  src += 'weight:' + circleRadiusThick + '';
  src += '' + biggerCircleOnTheRightSide;

  return src;
}


function drawRadius(center: { lat, lng }, end: { lat, lng }) {
  const distanceLng = end.lng - center.lng;

  const lineWidth = distanceLng / 50;
  const lineOffset = lineWidth * 2;

  const count = Math.floor((end.lng - center.lng) / (lineWidth + lineOffset));
  const res = [];

  for (let i = 0; i < count; i++) {
    const from = { lat: center.lat, lng: center.lng + (i * lineWidth) + (i * lineOffset) };
    const to   = { lat: center.lat, lng: center.lng + ((i + 1) * lineWidth) + (i * lineOffset) };

    const coordsFrom = `${from.lat},${from.lng}`;
    const coordsTo = `${to.lat},${to.lng}`;

    res.push(encodeURI('path=color:0x33a3d7ff|weight:2|' + coordsFrom + '|' + coordsTo));
  }

  return res.join('&');
}
