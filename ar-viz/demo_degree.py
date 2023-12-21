import cv2
import cv2.aruco as aruco
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import math

def rotation_vector_to_euler_angles(rvec):
    R, _ = cv2.Rodrigues(rvec)
    sy = math.sqrt(R[0,0] * R[0,0] +  R[1,0] * R[1,0])
    singular = sy < 1e-6
    if not singular:
        x = math.atan2(R[2,1] , R[2,2])
        y = math.atan2(-R[2,0], sy)
        z = math.atan2(R[1,0], R[0,0])
    else:
        x = math.atan2(-R[1,2], R[1,1])
        y = math.atan2(-R[2,0], sy)
        z = 0

    return np.rad2deg([x, y, z])

camera_matrix = np.array([[4.13768736e+03, 0.00000000e+00, 1.25976349e+03],
                          [0.00000000e+00, 4.16439178e+03, 8.48156504e+02],
                          [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]])
dist_coeffs = np.array([-1.02243369e+00, -5.76494459e+01, -1.07094988e-01, -1.23742408e-01, 7.70511502e+02])
desired_id = 15

aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_7X7_50)
parameters = cv2.aruco.DetectorParameters()

cap = cv2.VideoCapture(0)

plt.ion()
fig = plt.figure()
ax1 = fig.add_subplot(121, projection='3d')
ax2 = fig.add_subplot(122)

ax1.set_xlabel('X Position')
ax1.set_ylabel('Y Position')
ax1.set_zlabel('Z Position')

ax2.set_xlabel('Angle (degrees)')
ax2.set_ylabel('Euler Angles')
ax2.set_ylim([-180, 180])

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    corners, ids, rejectedImgPoints = aruco.detectMarkers(gray, aruco_dict, parameters=parameters)

    if ids is not None:
        for i, id in enumerate(ids):
            if id == desired_id:
                rvec, tvec, _ = aruco.estimatePoseSingleMarkers([corners[i]], 0.05, camera_matrix, dist_coeffs)

                cv2.drawFrameAxes(frame, camera_matrix, dist_coeffs, rvec[0], tvec[0], 0.1)

                euler_angles = rotation_vector_to_euler_angles(rvec[0])

                ax1.clear()
                ax1.scatter(tvec[0][0], tvec[0][1], tvec[0][2])
                ax1.set_title('Position')

                ax2.clear()
                ax2.bar(['Roll', 'Pitch', 'Yaw'], euler_angles)
                ax2.set_title('Rotation')

                plt.pause(0.001)

                break

    cv2.imshow('Frame', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
plt.close(fig)
