import numpy as np
import h5py
import sys
import json

events = []

if len(sys.argv) != 3:
  print('Usage: python h5toJSON.py [h5 input file name] [json output file name]')
  sys.exit()

ifile = h5py.File(sys.argv[1],'r')
ofile = open(sys.argv[2],'w')

hcal = np.array(ifile['HCAL'])
ecal = np.array(ifile['ECAL'])
target = np.array(ifile['target'])

print('TARGET:', target.shape)
print('ECAL:', ecal.shape)
print('HCAL:', hcal.shape)

en = 0
ei = ecal.shape[1]
ej = ecal.shape[2]
ek = ecal.shape[3]

hi = hcal.shape[1]
hj = hcal.shape[2]
hk = hcal.shape[3]

assert(ecal.shape[0] == hcal.shape[0] == target.shape[0])

for e in range(ecal.shape[0]):

  ec = ecal[e]
  hc = hcal[e]

  event = {}
  event['primary'] = []
  event['ecal'] = []
  event['hcal'] = []

  for i in range(ei):
    for j in range(ej):
      for k in range(ek):

        energy = ec[i][j][k]

        if energy > 0:
          event['ecal'].append([i,j,k,energy])

  for i in range(hi):
    for j in range(hj):
      for k in range(hk):

        energy = hc[i][j][k]

        if energy > 0:
          event['hcal'].append([i,j,k,energy])
  
  events.append(event)
  en += 1

ofile.write(json.dumps(events))
