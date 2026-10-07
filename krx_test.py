import os  # 환경변수 접근용 모듈
import requests  # HTTP 요청용 라이브러리
import pandas as pd  # 표(DataFrame) 처리용 라이브러리
from dotenv import load_dotenv  # .env 파일 로더

load_dotenv()  # .env 파일의 값을 환경변수로 불러옴
api_key = os.getenv("KRX_API_KEY")  # 환경변수에서 인증키 읽기 (코드에 직접 쓰지 않음)
if not api_key:  # 인증키가 없으면
    raise SystemExit(".env 파일에 KRX_API_KEY가 설정되어 있지 않습니다.")  # 안내 후 종료

url = "https://data-dbg.krx.co.kr/svc/apis/idx/krx_dd_trd"  # KRX 시리즈 일별시세정보 엔드포인트
headers = {"AUTH_KEY": api_key}  # 인증키를 요청 헤더 AUTH_KEY에 담음
params = {"basDd": "20261006"}  # 기준일자 파라미터

resp = requests.get(url, headers=headers, params=params, timeout=30)  # API 호출
resp.raise_for_status()  # HTTP 오류(4xx/5xx)면 예외 발생
data = resp.json()  # 응답 본문을 JSON(딕셔너리)으로 변환

df = pd.DataFrame(data.get("OutBlock_1", []))  # OutBlock_1 리스트를 pandas 표로 변환
if df.empty:  # 데이터가 비어 있으면
    raise SystemExit("OutBlock_1 데이터가 없습니다. 응답: " + str(data))  # 응답 내용과 함께 종료

result = df[["IDX_NM", "CLSPRC_IDX", "FLUC_RT"]]  # 지수명, 종가, 등락률 열만 선택
result.columns = ["지수명", "종가", "등락률"]  # 열 이름을 한글로 변경
print(result.to_string(index=False))  # 인덱스 없이 표 전체 출력
