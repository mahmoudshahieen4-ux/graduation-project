import http from 'http';

const testAudioData = "data:audio/webm;codecs=opus;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh2kM2mX9x6yDgQKGhkFfT1BVU2Oik09wdXNIZWFkAQEAAIC7AAAAAADhjbWERqqWJwB+g0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh2kM2mX9x6yDgQKGhkFfT1BVU2Oik09wdXNIZWFkAQEAAIC7AAAAAADhjbWERqqWJwB+g0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh2kM2mX9x6yDgQKGhkFfT1BVU2Oik09wdXNIZWFkAQEAAIC7AAAAAADhjbWERqqWJwB+"; // tiny dummy webm

const data = JSON.stringify({
  patientId: 'test-patient',
  doctorId: 'test-doctor',
  audioData: testAudioData
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/calls',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
