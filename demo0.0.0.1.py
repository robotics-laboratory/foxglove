import cv2
import cv2.aruco as aruco
import numpy as np

camera_matrix = np.array([[4.13768736e+03, 0.00000000e+00, 1.25976349e+03],
                          [0.00000000e+00, 4.16439178e+03, 8.48156504e+02],
                          [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]])
dist_coeffs = np.array([-1.02243369e+00, -5.76494459e+01, -1.07094988e-01, -1.23742408e-01, 7.70511502e+02])
desired_id = 15

aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_7X7_50)
parameters = cv2.aruco.DetectorParameters()

cap = cv2.VideoCapture(0)

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

                rot_mat, _ = cv2.Rodrigues(rvec[0])
                rot_str = "Rot: " + str(np.round(rot_mat, 2))
                trans_str = "Trans: " + str(np.round(tvec[0], 2))
                cv2.putText(frame, rot_str, (0, 25), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(frame, trans_str, (0, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                break

    cv2.imshow('Frame', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
