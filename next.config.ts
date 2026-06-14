import type { NextConfig } from "next";

const HOURS = 60 * 60;

const nextConfig: NextConfig = {
  experimental: {
    // 클라이언트 라우터 캐시(Client Router Cache) 보존 시간 설정.
    //
    // 중요: 이것은 DB 데이터 캐시가 아니라, 이미 prefetch된 화면의 RSC 페이로드를
    //   "브라우저(클라이언트) 안에서" 얼마나 오래 재사용할지 정하는 값이다.
    //   - 화면 간 이동(prefetch된 링크 클릭)이 서버 왕복 없이 즉시 뜨도록 도와준다.
    //   - 새로고침(하드 리프레시)이나 첫 방문(콜드 스타트)은 항상 서버에서 새로 가져온다.
    //   - Server Action / revalidatePath / router.refresh / 동기화 버튼은 이 캐시를 비운다.
    //   그래서 RLS로 보호된 사용자별 데이터가 다른 사용자에게 새는 위험은 없다.
    //   (각 브라우저가 자기 세션으로 받은 페이로드만 자기 안에서 재사용한다.)
    staleTimes: {
      // static: 정적 생성 페이지 + `prefetch={true}`로 완전히 prefetch된 링크에 적용.
      //   명부(/members)·캘린더(/visits)처럼 자주 안 바뀌고 무거운 화면을
      //   12시간 동안 클라이언트에서 재사용하도록 길게 잡는다.
      static: 12 * HOURS,
      // dynamic: 완전히 prefetch되지 않은 일반 동적 이동에 적용.
      //   여기는 보수적으로 0(캐시 안 함)으로 둬서, 우리가 명시적으로
      //   prefetch={true}를 지정한 화면만 길게 캐시되도록 한다.
      dynamic: 0,
    },
  },
};

export default nextConfig;
